/**
 * @namespace
 */
site.conversions = (function () {
    var MODULE = '[site.conversions]';
    var LINK_SELECTOR = '[href="/no/butikk/Kassen/"], [href="/sv/Butik/Kassen/"], [href="/fi/butikk/Kassen/"], [href="/de/butikk/Kassen/"]';

    /**
     * apply conditional conversion tracking to every button which links to /no/butikk/Kassen/
     * send mobile conversion when certain elements that are meant only for Mobile are visible, and similar for Desktop
     */
    function _trackDirectLinkConversion() {
        var self = this;
        // Get els by Classname
        var els = easy.domElements.selector(LINK_SELECTOR);
        // Apply event listener for each el
        easy.utils.each(els, function (el) {
            easy.domEvents.on(el, 'click', _handleClick.bind(self));
        });

        /**
         * applied tracking on click
         * @param  {[type]} el [description]
         * @return {[type]}    [description]
         */

        function _handleClick( /* el */ ) {
            var type = '';
            if (_isMobileMod()) {
                type = 'ClickedCheckoutMobile1';
            } else if (_isDesktopMod()) {
                type = 'ClickedCheckoutDesktop1';
            }

            if (type.length === 0) {
                return;
            }

            easy.dataLayer.handleItem({
                conversionId: 'clickedCheckout',
                conversionType: 'clickedCheckout',
                conversionValue: 1,
                frosmoConversionName: type
            });
        }

        /**
         * return true if Kassen buttons meant for DESKTOP are visible
         * @return {Boolean}
         */
        function _isDesktopMod() {
            var elements = easy.domElements.selector('.fr-dekstop-kassen-wrapper');
            if (elements.length === 0) {
                return false;
            }
            return easy.domElements.isStyleVisible(elements[0]) && easy.domElements.isVisible(easy.domElements.selector('#shopping-bag-items')[0]);
        }

        /**
         * return true if Kassen buttons meant for MOBILE are visible
         * @return {Boolean}
         */
        function _isMobileMod() {
            var elements = easy.domElements.selector('.fr-mobile-kassen-wrapper');
            if (elements.length === 0) {
                return false;
            }
            return easy.domElements.isStyleVisible(elements[0]) && easy.domElements.isVisible(easy.domElements.selector('#shopping-bag-content')[0]);
        }
    }

    /**
     * same as _trackDirectLinkConversion but slightly different condition for conversion sending for comparision group users
     */
    function _trackDirectLinkConversionForComparisonGroup() {
        var self = this;

        var els = document.querySelectorAll(LINK_SELECTOR);

        easy.utils.each(els, function (el) {
            easy.domEvents.on(el, 'click', _handleClick.bind(self));
        });

        function _handleClick( /* el */ ) {
            var type = '';
            if (_isMobileMod()) {
                type = 'ClickedCheckoutMobile2';
            } else if (_isDesktopMod()) {
                type = 'ClickedCheckoutDesktop2';
            }

            if (type.length === 0) {
                return;
            }

            easy.dataLayer.handleItem({
                conversionId: 'clickedCheckout',
                conversionType: 'clickedCheckout',
                conversionValue: 1,
                frosmoConversionName: type
            });
        }

        /**
         * return true if Kassen buttons meant for DESKTOP are visible
         * @return {Boolean}
         */
        function _isDesktopMod() {
            return easy.domElements.isVisible(easy.domElements.selector('#shopping-bag-items')[0]) && !easy.domElements.isVisible(easy.domElements.selector('#shopping-bag-content')[0]);
        }

        /**
         * return true if Kassen buttons meant for MOBILE are visible
         * @return {Boolean}
         */
        function _isMobileMod() {
            return easy.domElements.isVisible(easy.domElements.selector('#shopping-bag-content')[0]);
        }
    }

    /**
     * All functionality that is tied to receipt page
     * Sends conversion data to server
     */
    function _handleReceiptPage() {
        easy.addExceptionHandling(function () {
            var orderDetails = easy.domElements.selector('#OrderDetails')[0];
            var products = [];
            var skus = [];

            if (!orderDetails) {
                throw new Error('Unable to find OrderDetails');
            }

            // create skus array from data-sku attributes of li elements
            easy.utils.each(orderDetails.querySelectorAll('li'), function (value) {
                skus.push(value.getAttribute('data-sku'));
            });

            // prepare params for making API call with skuVariant method
            var params = {
                method: 'skuVariant',
                skus: '[' + skus + ']'
            };

            // make API request for product Id, on success, create array of product list for transaction
            site.utils.requestProductIdFromApi(params, function (resp) {
                easy.console.log(resp);

                easy.utils.each(orderDetails.querySelectorAll('li'), function (productElement) {
                    var product = {
                        id: resp.data[productElement.getAttribute('data-sku')],
                        price: productElement.getAttribute('data-itemprice'),
                        quantity: productElement.getAttribute('data-itemquantity')
                    };

                    // a valid product for transaction should have valid form of id, defined price, and a positive number of products
                    var valid = !(!site.utils.isValidProductId(product.id) || !product.price || !easy.utils.isPositiveInteger(product.quantity));

                    if (!valid)  {
                        easy.console.log('Transaction product invalid: ', product, productElement);
                        easy.api.error('Transaction product invalid', easy.ERROR_SITE_CONVERSION_VALUE, {
                            html: frosmo.JSON.stringify(product)
                        });
                    } else {
                        products.push(product);
                    }
                });

                // send transaction details for conversion tracking
                easy.dataLayer.handleItem({
                    transactionId: orderDetails.querySelector('#OrderNumber').textContent,
                    transactionTotal: orderDetails.querySelector('#OrderValue').textContent,
                    transactionProducts: products
                });
            });
        }, {
            code: easy.ERROR_SITE_CONVERSION
        })();
    }

    /**
     * Initialize the Conversions module
     *
     * @memberof site.conversions
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        var self = this;
        easy.events.on(site.events.RECEIPT_PAGE_VIEW, _handleReceiptPage);
        easy.events.on(site.events.SITE_BUTTON_LOADED, _trackDirectLinkConversion.bind(self));

        // If Comparision Group user is decected, then apply tracking function for comparison group users
        if (site.utils.isComparisonGroup()) {
            easy.events.on(site.events.TRIGGER_CART_LINK_DESKTOP, _trackDirectLinkConversionForComparisonGroup);
        }
    }


    return {
        init: init,
        _handleReceiptPage: _handleReceiptPage,
        _trackDirectLinkConversion: _trackDirectLinkConversion,
        LINK_SELECTOR: LINK_SELECTOR
    };
}());