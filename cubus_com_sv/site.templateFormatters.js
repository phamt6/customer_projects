/**
 * @namespace
 */
site.templateFormatters = (function () {
    var MODULE = '[site.templateFormatters]';

    function _formatRecoPrice(price) {
        var formattedPrice = String(price);
        formattedPrice = formattedPrice.replace('.', ',');
        formattedPrice = formattedPrice.replace(',00', ':-');

        return formattedPrice;
    }

    function _formattedDiscountPrice() {
        return _formatRecoPrice(this.discountPrice);
    }

    function _formattedPrice() {
        return _formatRecoPrice(this.price);
    }

    function _availableAsBoolean() {
        return this.available === 'true' || this.available === true;
    }

    function _isOnSaleAsBoolean() {
        return this.isOnSale === 'true' || this.isOnSale === true;
    }

    function _campaignAsBoolean() {
        return this.campaign.length > 0;
    }

    /**
     * Initialize the templateFormatters module
     *
     * @memberof site.renderers
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.template.addFormatter('formattedDiscountPrice', _formattedDiscountPrice);
        easy.template.addFormatter('formattedPrice', _formattedPrice);
        easy.template.addFormatter('availableBool', _availableAsBoolean);
        easy.template.addFormatter('isOnSaleBool', _isOnSaleAsBoolean);
        easy.template.addFormatter('campaignBool', _campaignAsBoolean);
    }


    return {
        init: init
    };
}());