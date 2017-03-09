/**
 * @namespace
 */
site.renderers = site.renderers || {};

site.renderers.elasticSearchResults = (function () {
    var MODULE = '[site.renderers.elasticSearchResults]';

    /**
     * Checks if a product is valid
     * Should mirror reco.inpref.frosmo method isValidProduct
     * @param  {object}  product Product object from Custom API
     * @return {Boolean}         true if product is valid; false otherwise
     */
    function isValidProduct(product) {
        return site.utils.productHasRequiredAttributes(product) &&
            site.utils.diffInHours(product.updated) < 3 &&
            site.utils.getProductStockTotal(product) > 12;
    }

    /**
     * Get product main category (DAM/HERR/BARN) for a product object
     * @param  {Object} product Product object
     * @return {string}         Main category as string eg. DAM, HERR
     */
    function getProductMainCategory(categoryType) {
        if (!categoryType) {
            return null;
        }
        var key = easy.utils.find(Object.keys(site.config.translations.categories), function (key) {
            var matcher = new RegExp(key + '(\\W|$)');
            return categoryType.match(matcher);
        });
        return site.config.translations.categories[key];
    }

    /**
     * (CUBUS-36) Search optimisation with elastic search
     * @param  {Object}   positionData All the data relative to the message like placement, message itself, etc
     */
    function elasticSearchResults(positionData) {
        var message = positionData.getMessageInstance();
        var container = document.querySelector('div[data-frosmo-message-id="' + message.id + '"]');
        // Get the query term user has used
        var queryTerm = easy.utils.getLocationFromUrl(window.location.href).queryVariables.q;
        var htmlContent;
        var userLastVisitedCategory = easy.context.site.lastVisitedCategory;
        var products;
        // Create category buckets for template
        var templateData = {
            categories: easy.utils.map(Object.keys(site.config.translations.categories), function (key) {
                return {
                    name: site.config.translations.categories[key],
                    type: key,
                    products: []
                };
            })
        };
        var productContainer = document.querySelector('#productContainer');
        var documentSearchHits = document.querySelector('.search-hits');
        var emptySearchResult = document.querySelector('.empty-search-result') || document.querySelector('.content-search-container + p');
        var modificationSearchHits;
        var modificationResults;
        var resultHits = [];
        var temporaryDiv = document.createElement('div');

        /**
         * Initialise functionality related to UI
         */
        function initUserInterface() {
            var mainCategoryLinks = easy.domElements.selector('a[data-category-type]');
            var selectedCategory = 'frosmo-search-category-selected';
            var defaultCategory = document.querySelector('a[data-category-type="' + userLastVisitedCategory + '"') || mainCategoryLinks[0];

            /**
             * Show category results
             */
            function showCategory(category) {
                var categoryTypes = easy.domElements.selector('[data-category-type]');
                easy.utils.each(categoryTypes, function (element) {
                    easy.utils.removeClassName(element, selectedCategory);
                    if (element.getAttribute('data-category-type') === category.getAttribute('data-category-type')) {
                        easy.utils.addClassName(element, selectedCategory);
                    }
                });
            }

            /**
             * Attach link click behaviour
             * Hides all but selected category
             */
            function attachLinkBehaviour(link) {
                easy.domEvents.on(link, 'click', function (event, element) {
                    showCategory(element);
                });
            }

            /**
             * Modification behaviour init
             */
            function init() {
                easy.utils.each(mainCategoryLinks, attachLinkBehaviour);
                showCategory(defaultCategory);
            }

            init();
        }

        // Customer search found results - don't show elastic results
        if (productContainer) {
            return;
        }

        if (queryTerm.length < 2) {
            return;
        }

        // Get elastic results for query
        easy.fetch.ajax({
            method: 'GET',
            url: site.config.customApiUrl,
            params: {
                method: 'search',
                queries: frosmo.JSON.stringify([queryTerm])
            }
        }).then(function (response) {
            // Filter only valid products
            products = easy.utils.filter(response.data[0].products, function (product) {
                return isValidProduct(product);
            });

            if (products.length === 0) {
                return;
            }

            // Distribute products into category buckets
            easy.utils.each(products, function (product) {
                // Find category
                var category = easy.utils.find(templateData.categories, function (category) {
                    return category.name === getProductMainCategory(product.type);
                });
                if (!category) {
                    easy.sendError('Unable to find category for product: ' + product.type, easy.ERROR_SITE_RENDERER);
                    return;
                }
                // Push to template bucket
                category.products.push(product);
                // Add hit to results array
                // All keys in highlight - search fields
                easy.utils.each(Object.keys(product.meta.highlight), function (key) {
                    // each highlight in search field
                    easy.utils.each(product.meta.highlight[key], function (highlight) {
                        temporaryDiv.innerHTML = highlight;
                        // each hit in result
                        easy.utils.each(easy.utils.arrayFrom(temporaryDiv.children), function (tag) {
                            resultHits.push(tag.textContent.toLowerCase());
                        });
                    });
                });
            });

            // Take only unique hits
            resultHits = easy.utils.uniq(resultHits).slice(0, 2);

            // Render template
            htmlContent = message.renderTemplate(templateData);

            // Insert to page
            message.insertHtml(htmlContent);

            // Move search hits to document
            modificationSearchHits = easy.utils.arrayFrom(container.querySelector('.search-hits').children);
            easy.utils.each(modificationSearchHits.reverse(), function (result) {
                documentSearchHits.insertBefore(result, documentSearchHits.firstChild);
            });

            // Move search results to document
            modificationResults = easy.domElements.selector('div[data-category-type]');
            easy.utils.each(modificationResults.reverse(), function (result) {
                // Insert all search results to top of results
                documentSearchHits.parentNode.parentNode.insertBefore(result, documentSearchHits.parentNode.nextElementSibling);
            });

            // Append text about what hits we're showing
            emptySearchResult.appendChild(document.createTextNode('. ' + site.config.translations.didYouMean + ': "' + resultHits.join(', ') + '"'));

            // Add results to tracking
            message.setTrackableElements(modificationResults);

            // Start tracking
            message.startTracking();

            // Bind UI functionality
            initUserInterface();
        }).catch(function (error) {
            easy.sendError('Unable to display elastic search results: ' + error.message, easy.ERROR_SITE_RENDERER);
        });
    }

    /**
     * Initialize the Renderers module
     *
     * @memberof site.renderers
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.messageShow.addCustomRenderer('elasticSearchResults', elasticSearchResults);
    }


    return {
        init: init
    };
}());