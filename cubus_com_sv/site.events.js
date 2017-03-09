/* global easy, site */
site.events = (function () {
    /** **** VARIABLES *******/
    var MODULE = '[site.events]';

    /**
     * Trigger events for distinguishing page types
     */
    function _triggerPageEventsBasedOnDOM() {
        var bodyAttr = document.querySelector('body').getAttribute('data-pagetype');

        switch (bodyAttr) {
        case 'ProductPage':
            easy.events.trigger(site.events.PRODUCT_PAGE_VIEW);
            break;
        case 'ProductListPage':
            easy.events.trigger(site.events.PRODUCTLIST_PAGE_VIEW);
            break;
        case 'ReceiptPage':
            easy.events.trigger(site.events.RECEIPT_PAGE_VIEW);
            break;
        case 'SuperPage':
            easy.events.trigger(site.events.SUPER_PAGE_VIEW);
            break;
        case 'CategoryPage':
            easy.events.trigger(site.events.CATEGORY_PAGE_VIEW);
            break;
        default:
            break;
        }
    }

    /**
     * if there are items in cart trigger DESKTOP and MOBILE events
     * onload, there is no AJAX call so wait 10s for needed information to finish loading
     * while users on page, cart is updated on ajax calls, so listen to event and trigger modification
     */
    function _checkCart() {
        easy.utils.waitFor(200, 10000, function () {
            if (site.utils.isCartNotEmpty()) {
                easy.events.trigger(site.events.TRIGGER_CART_LINK_DESKTOP);
                easy.events.trigger(site.events.TRIGGER_CART_LINK_MOBILE);
                return true;
            }
            return false;
        }, function () {
            easy.console.log('_checkCart failure - cart is empty');
        });

        easy.events.on(easy.EVENT_JQUERY_READY, function ($) {
            $(document).ajaxComplete(function ( /* event, xhr, settings */ ) {
                _triggerModification();
            });
        });

        function _triggerModification() {
            easy.setTimeout(function () {
                if (site.utils.isCartNotEmpty()) {
                    easy.events.trigger(site.events.TRIGGER_CART_LINK_DESKTOP);
                    easy.events.trigger(site.events.TRIGGER_CART_LINK_MOBILE);
                } else {
                    easy.events.trigger(site.events.HIDE_TRIGGER_CART_LINK_DESKTOP);
                    easy.events.trigger(site.events.HIDE_TRIGGER_CART_LINK_MOBILE);
                }
            }, 100);
        }
    }

    function triggerEventsOnDataLayerLoad() {
        easy.utils.waitFor(200, 5000, function () {
            if (window.prodListObj && window.prodListObj.currentCatalogNode) {
                easy.events.trigger(site.events.CATEGORY_PAGE_DATALAYER_LOADED);
                return true;
            }
            return false;
        }, function () {
            easy.console.log('triggerEventsOnDataLayerLoad failure - not a catalog page');
        });
    }

    /** **** PUBLIC *******/
    function init() {
        easy.console.log(MODULE, 'initialisation ');

        // Trigger page events when DOM is ready
        easy.events.once(easy.EVENT_DOM_READY, _triggerPageEventsBasedOnDOM);
        triggerEventsOnDataLayerLoad();
        _checkCart();
    }

    /** **** API *******/
    return {
        init: init,
        PRODUCT_PAGE_VIEW: 'PRODUCT_PAGE_VIEW',
        PRODUCTLIST_PAGE_VIEW: 'PRODUCTLIST_PAGE_VIEW',
        RECEIPT_PAGE_VIEW: 'RECEIPT_PAGE_VIEW',
        SUPER_PAGE_VIEW: 'SUPER_PAGE_VIEW',
        CATEGORY_PAGE_VIEW: 'CATEGORY_PAGE_VIEW',
        TRIGGER_CART_LINK_DESKTOP: 'TRIGGER_CART_LINK_DESKTOP',
        TRIGGER_CART_LINK_MOBILE: 'TRIGGER_CART_LINK_MOBILE',
        HIDE_TRIGGER_CART_LINK_DESKTOP: 'HIDE_TRIGGER_CART_LINK_DESKTOP',
        HIDE_TRIGGER_CART_LINK_MOBILE: 'HIDE_TRIGGER_CART_LINK_MOBILE',
        SITE_BUTTON_LOADED: 'SITE_BUTTON_LOADED',
        CATEGORY_PAGE_DATALAYER_LOADED: 'CATEGORY_PAGE_DATALAYER_LOADED'
    };
}());