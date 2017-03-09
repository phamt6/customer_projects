/**
 * @namespace
 */
site.products = (function () {
    var MODULE = '[site.products]';
    var scopeWindow;

    /**
     * All functionality that is tied to product page
     * Parse product data and send to DB
     */
    function _handleProductPage() {
        var productId = scopeWindow.location.pathname.split('/').pop();
        _parseProduct(productId, document.querySelector('article.product'));
    }

    /**
     * Handle super page functionality - popup products
     */
    function _handleSuperPage() {
        // Attach XHR handler to send product data
        easy.events.on(easy.EVENT_JQUERY_READY, function ($) {
            $(document).ajaxSuccess(function (event, jqxhr, settings) {
                easy.addExceptionHandling(function () {
                    if (settings.url.match(/^\/Variant\/GetProductAsync/)) {
                        var productId = settings.url.match(/\?code\=(\d{7})\_/).pop();
                        _parseProduct(productId, document.querySelector('#quickShopModal'));
                    }
                }, {
                    code: easy.ERROR_SITE_PRODUCT_ATTRIBUTE
                })();
            });
        });
    }


    /**
     * Parse a product - separated to a function for easier testing
     * @param  {string} productId           Product ID from url (or manually for testing)
     * @param  {object} productDataElement  DOM data element
     * @memberOf site.productsCommmon
     */
    function _parseProduct(productId, productDataElement) {
        function getDomainUrl() {
            return [scopeWindow.location.protocol, '//', scopeWindow.location.host].join('');
        }

        // Dummy object - don't send product data via scraping since XML importer has this covered
        var doNotUpdateAttribute = {
            getAttributeData: function () {
                return '';
            }
        };

        // Set product attributes here for product tracking
        site.config.productAttributes = {
            id: {
                getAttributeData: function (dataElement, url) {
                    return productId;
                },
                validate: site.utils.isValidProductId
            },
            name: doNotUpdateAttribute,
            type: doNotUpdateAttribute,
            price: doNotUpdateAttribute,
            // Image is consistently avialable in XML feed - scrape it from page
            image: {
                getAttributeData: function (dataElement, url) {
                    var metaImageElement = document.querySelector('meta[property="og:image"]');
                    return metaImageElement ? metaImageElement.getAttribute('content') : [getDomainUrl(), productDataElement.querySelector('.image-wrap img').getAttribute('src')].join('');
                },
                validate: function (data, parserUtils) {
                    return parserUtils.validate.url(data);
                }
            },
            url: doNotUpdateAttribute

        };

        // Parse product attributes and send to server
        var productParser, parsedProduct;

        easy.addExceptionHandling(function () {
            if (!productDataElement) {
                throw new Error('Unable to find product element');
            }

            productParser = site.productParser(productDataElement, site.config.productAttributes);
            parsedProduct = productParser.parse();

            if (parsedProduct) {
                productParser.send(parsedProduct);
            }
        }, {
            code: easy.ERROR_SITE_PRODUCT
        })();
    }


    /**
     * Initialize the Products module
     *
     * @memberof site.products
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        scopeWindow = window.jasmine ? window.jasmine.window : window;

        easy.events.on(site.events.PRODUCT_PAGE_VIEW, _handleProductPage);
        easy.events.on(site.events.SUPER_PAGE_VIEW, _handleSuperPage);
    }


    return {
        init: init,
        _parseProduct: _parseProduct,
        _handleProductPage: _handleProductPage
    };
}());