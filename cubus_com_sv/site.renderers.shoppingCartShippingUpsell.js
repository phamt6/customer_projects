site.renderers = site.renderers || {};

site.renderers.shoppingCartShippingUpsell = (function () {
    var MODULE = '[site.renderers.shoppingCartShippingUpsell]';

    /**
     * Shopping cart upsell - show product that would push price over 600 NOK
     * @param  {[type]} positionData [description]
     */
    function _shoppingCartShippingUpsell(positionData) {
        /**
         * Create float out of a price string
         * @param  {string} stringPrice Price string - eg. "261,75 NOK"
         * @return {float}              Price as float - eg 261.75
         */
        function floatPrice(stringPrice) {
            return parseFloat(site.utils._trimAllSpaces(stringPrice.replace(' NOK', '').replace(',', '.')));
        }

        /**
         * Add product to cart
         * @param {string} sku Product SKU
         */
        function addProductToCart(sku) {
            window.cartObject.addItem(sku, null, 1);
        }

        var instance;
        var priceLimit = 600;
        var subTotal;
        var totalPrice;
        var cartRemoveButtons;
        var shoppingCartProducts;
        var products;
        var upsellProduct;
        var addToCartButton;

        // Get subtotal of current cart
        subTotal = easy.utils.find(document.querySelectorAll('.cart-calculation li'), function (element) {
            return element.querySelector('div.left').textContent.match(/Subtotal/);
        });

        totalPrice = floatPrice(subTotal.querySelector('.right').textContent);

        // If price is less than 600 - don't offer products
        if (totalPrice >= priceLimit) {
            return;
        }

        instance = positionData.getMessageInstance();

        // Hidden revision logic exits here - no template defaults available to move forward
        if (instance.revisionType === 'hidden') {
            instance.startTracking();
            return;
        }

        // Get current shopping cart products
        cartRemoveButtons = document.querySelectorAll('#cartItemList button.item-remove');
        shoppingCartProducts = easy.utils.map(cartRemoveButtons, function (button) {
            return site.utils.getProductIdFromCode(button.getAttribute('data-sku-id'));
        });

        // Sort products - cheapest first
        products = instance.template.defaults.products.sort(function (a, b) {
            return floatPrice(a.discountPrice) - floatPrice(b.discountPrice);
        });

        // Remove products already in shopping cart
        products = easy.utils.filter(products, function (product) {
            return !easy.utils.find(shoppingCartProducts, function (cartProduct) {
                return cartProduct === product.id;
            });
        });

        // Find cheapest product that will push price over priceLimit
        upsellProduct = easy.utils.find(products, function (product) {
            return totalPrice + floatPrice(product.discountPrice) > priceLimit;
        });

        // No applicable product - stop modification
        if (!upsellProduct) {
            return;
        }

        // Get first sku of matching product
        upsellProduct.sku = upsellProduct.skus.split('|')[0];

        // Render template
        instance.insertTemplate({
            title: instance.template.defaults.title,
            name: upsellProduct.name,
            price: upsellProduct.discountPrice,
            image: upsellProduct.image,
            sku: upsellProduct.sku
        });

        // Start message KPI tracking
        instance.startTracking();

        // Bind add to cart functionality
        addToCartButton = document.querySelector('.frosmo-cart-upsell-button');
        easy.domEvents.on(addToCartButton, 'click', addProductToCart.bind(null, upsellProduct.sku));
    }


    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.messageShow.addCustomRenderer('shoppingCartShippingUpsell', _shoppingCartShippingUpsell);
        easy.messageShow.addCustomRenderer('shoppingCartShippingUpsell.hidden', _shoppingCartShippingUpsell);

    }

    return {
        init: init
    };
}());