/**
 * @namespace
 */
site.renderers = (function () {
    var MODULE = '[site.renderers]';

    /**
     * Checks if a product is valid
     * Should mirror reco.inpref.frosmo method isValidProduct
     * @param  {object}  product Product object from Custom API
     * @return {Boolean}         true if product is valid; false otherwise
     */
    function _isValidProduct(product) {
        return site.utils.productHasRequiredAttributes(product) &&
            site.utils.diffInHours(product.updated) < 3 &&
            site.utils.getProductStockTotal(product) > 12
        /* && !product.isOnSale*/
        ;
    }

    /**
     * Add template product variables that are normally provided by reco.frosmo
     * TODO: remove once API2 backend supports this directly
     *
     * @param {object} product Product object from Custom API
     */
    function _addTemplateProductVariables(product) {
        var templateProduct = easy.utils.clone(product);
        templateProduct.stockTotal = site.utils.getProductStockTotal(product);
        return templateProduct;
    }

    /**
     * Render API2 provided products for a message with a template
     * @param  {[type]}   products [description]
     * @param  {[type]}   message  [description]
     * @param  {[type]}   el       [description]
     * @param  {Function} cb       [description]
     * @return {[type]}            [description]
     */
    function _renderAPI2ProductsForTemplateMessage(products, message, el, cb) {
        // Filter invalid products
        products = easy.utils.filter(products, _isValidProduct);

        // Not enough products to render message
        if (products.length < message.template.defaults.products.length) {
            easy.console.log('Not enough products to render message #' + message.id, products);
            return;
        }

        if (site.utils.isComparisonGroup()) {
            cb();
            return;
        }

        // take recommendation settings amount of products
        products = products.slice(0, message.template.defaults.products.length);

        // Add template product variables
        products = easy.utils.map(products, _addTemplateProductVariables);

        // Clone defaults then replace the products
        // This way we get any custom parameters that were provided like 'title' etc
        var templateDefaults = easy.utils.clone(message.template.defaults);
        templateDefaults.products = products;

        // easy.console.log('render', templateDefaults, message.template.defaults);

        easy.utils.addClassName(el, 'frosmo_inline');
        easy.domElements.insertHtml(
            el,
            easy.template.render(easy.config.templates[message.template.variable], templateDefaults)
        );

        cb();
    }

    /**
     * Top viewed/converted for a category data from Custom API to a templated message
     *
     * message.defaults.apiMethod needs to be set to:
     * convSearchCategory, viewSearchCategory
     *
     * @param  {[type]}   positionData All the data relative to the message like placement, message itself, etc
     * @param  {[type]}   message      Info about the message like content, revision, etc
     * @param  {[type]}   el           Element where the message is inserted
     * @param  {Function} cb           Needs to be called in order to get true displays and message tracking
     */
    function _categoryPageRecommendation(positionData, message, el, cb) {
        easy.events.on(site.events.CATEGORY_PAGE_DATALAYER_LOADED, function () {
            // Get main category and request products for that
            easy.utils.waitFor(200, 5000, function () {
                var activeCategoryMenu = easy.domElements.selector('.sidebar-nav .url-wrap.current > a').length > 0 &&
                    easy.domElements.selector('.sidebar-nav .url-wrap.current span.url-wrap.current').length === 0;
                if (/Barn|Baby|baby|Lapset/.test(window.location.pathname)) {
                    return true;
                }
                return activeCategoryMenu;
            }).catch(function ( /* error */ ) {
                throw String('waitFor failed - acceptable');
            }).then(function ( /* elements */ ) {
                var category = window.prodListObj.currentCatalogNode.split(' ');

                // Get bundle data for product
                return easy.fetch.ajax({
                    method: 'GET',
                    url: site.config.customApiUrl,
                    params: {
                        method: message.template.defaults.apiMethod,
                        queries: frosmo.JSON.stringify(category)
                    }
                });
            }).then(function (response) {
                var sortby = message.template.defaults.apiMethod === 'viewSearchCategory' ? 'viewscore' : 'convscore';

                var products = easy.utils.reduce(response.data, function (initial, result) {
                    Array.prototype.push.apply(initial, result.products);
                    return initial;
                }, []);

                products = products.sort(function (product1, product2) {
                    return product2.meta[sortby] - product1.meta[sortby];
                });

                _renderAPI2ProductsForTemplateMessage(products, message, el, cb);
            }).catch(function (error) {
                // Real errors
                if (error instanceof Error) {
                    easy.sendError('Unable to display category page recommendation: ' + error.message, easy.ERROR_SITE_RENDERER);
                    return;
                }

                // Failed waitFor - acceptable
                easy.console.log('_categoryPageRecommendation error: ' + error);
            });
        });
    }

    /**
     * Renderer keeps the original content of element and append the content of message to it
     * @param  {[type]}   positionData All the data relative to the message like placement, message itself, etc
     * @param  {[type]}   message      Info about the message like content, revision, etc
     * @param  {[type]}   el           Element where the message is inserted
     * @param  {Function} cb           Needs to be called in order to get true displays and message tracking
     *
     * Eg.: HTML markup has to be kept but small changes has to be done to it using CSS
     * Standard append type would not track clicks
     *
     */
    function appendAndKeepContent(positionData, message, el, cb) {
        if (message.revisionType !== 'hidden') {
            var div = document.createElement('div');
            easy.domElements.insertHtml(div, message.content, message);

            // Don't insert wrapping div
            easy.utils.each(div.children, function (element) {
                el.appendChild(element);
            });
        }

        cb();
    }

    /**
     * Initialize the Renderers module
     *
     * @memberof site.renderers
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.messageShow.addCustomRenderer('categoryPageRecommendation', _categoryPageRecommendation);
        easy.messageShow.addCustomRenderer('categoryPageRecommendation.hidden', _categoryPageRecommendation);

        easy.messageShow.addCustomRenderer('appendAndKeepContent', appendAndKeepContent);
    }


    return {
        init: init
    };
}());