/**
 * @namespace
 */
site.utils = (function () {
    // Required product attributes - mirror that of reco.inpref.com
    var _requiredProductAttributes = ['image', 'url', 'name', 'id', 'available', 'skus'];

    /**
     * Get diff in hours compared to current time
     * @param  {string} date Date string
     * @return {number}      Number of hours difference
     */
    function diffInHours(date) {
        var n = date.indexOf('+');
        date = date.substring(0, n !== -1 ? n : date.length);
        var formattedTime = new Date(date.replace(/\s+/g, 'T').concat('.000+01:00')).getTime();
        return (Date.now() - formattedTime) / 1000 / 60 / 60;
    }

    /**
     * Get total amount of stock for all variants from a product (SKU array)
     * @param  {Object} product Product object
     * @return {number}         Number of products in stock
     */
    function getProductStockTotal(product) {
        var skus = product.skus ? product.skus : [];
        return easy.utils.reduce(skus, function (init, current) {
            return init + parseInt(current.stock, 10);
        }, 0);
    }

    /**
     * Checks that a product has all required attributes
     * Should mirror reco.inpref.frosmo method has-attributes
     * @param  {object}  product Product object from Custom API
     * @return {Boolean}         true if product is valid; false otherwise
     */
    function productHasRequiredAttributes(product) {
        return easy.utils.reduce(_requiredProductAttributes, function (valid, attribute) {
            if (!product[attribute]) {
                valid = false;
            }
            return valid;
        }, true);
    }

    /**
     * return true if user is in comparison group
     * @returns {boolean} true if is user is in comparison group; false if not
     */
    function isComparisonGroup() {
        var returnValue = isComparisonGroup.cache ? isComparisonGroup.cache : isComparisonGroup.cache = easy.uid.isInComparisonGroup(easy.uid.get());
        return returnValue;
    }

    /**
     * return true if there is currently no product in cart
     * @returns {boolean} True if cart is empty; false otherwise
     * @memberOf site.utils
     */
    function isCartNotEmpty() {
        return document.getElementsByClassName('site-cart-button--has-items').length > 0;
    }

    /**
     * Trim all spaces from string
     * @param  {string} string String to trim
     * @returns {string}        Trimmed string
     * @memberOf site.utils
     */
    function _trimAllSpaces(string) {
        return string.replace(/\s+/g, '');
    }

    /**
     * Get product ID from sku or variant code
     * @param  {string} code Product SKU or variant
     * @returns {string}      Product ID if product id is valid; null otherwise
     * @memberOf site.utils
     */
    function getProductIdFromCode(code) {
        var match = code.match(/^\d{7}_.{4}/);
        return match ? match[0] : null;
    }

    /**
     * [requestProductIdFromApi makes Api request to convert Skus to ProductId]
     * If request succeed execute callback function, else throw errors
     * @param  {Object} params      Parameters for API query
     * @param  {Function} callback  Callback on successful query
     * @returns {null}              Nothing
     */
    function requestProductIdFromApi(params, callback) {
        if (!easy.utils.isObject(params)) {
            easy.api.error('site.utils.request(): Invalid params', easy.ERROR_SITE_CUSTOM_API);
            return;
        }

        if (!params.method) {
            easy.api.error('site.utils.request(): Invalid method', easy.ERROR_SITE_CUSTOM_API);
            return;
        }

        // If testing - forget about calling the actual API
        // Instead return a ready mapping of product data provided in config
        if (window.jasmine) {
            var response = {
                data: site.config.jasmineProductDataMapping,
                success: true
            };

            easy.addExceptionHandling(callback, {
                code: easy.ERROR_SITE_CUSTOM_API
            })(response);
            return;
        }

        easy.fetch.get(site.config.customApiUrl, {
            params: params,
            success: function (response) {
                easy.addExceptionHandling(callback, {
                    code: easy.ERROR_SITE_CUSTOM_API
                })(response);
            },
            failure: function () {
                easy.api.error('jsonp request error', easy.ERROR_SITE_CUSTOM_API);
            }
        });
    }

    /**
     * Get unique values from an array
     * http://codereview.stackexchange.com/questions/83717/filter-out-duplicates-from-an-array-and-return-only-unique-value
     * @param  {Array} xs Input array
     * @returns {Array}    Array of unique values
     * @memberOf site.utils
     */
    function getUniqueValues(xs) {
        return easy.utils.filter(xs, function (x, i) {
            return xs.indexOf(x) === i;
        });
    }

    /**
     * Validate a product id
     * @param  {string}  id Product id
     * @returns {boolean}    True if product id is valid; false otherwise
     * @memberOf site.utils
     */
    function isValidProductId(id) {
        var returnValue = isValidProductId.cache[id] ? isValidProductId.cache[id] : isValidProductId.cache[id] = !easy.utils.isEmpty(id) && getProductIdFromCode(id) === id;
        return returnValue;
    }
    isValidProductId.cache = {};

    /**
     * Get validated price from input
     * http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
     * @param  {any} price      Price input
     * @returns {number/boolean} Returns false if price is not valid number, else the validated price
     * @memberOf site.utils
     */
    function getValidatedPrice(price) {
        if (Object.prototype.toString.call(price) === '[object Number]') {
            return price;
        }

        if (Object.prototype.toString.call(price) !== '[object String]') {
            return false;
        }

        var priceString = _trimAllSpaces(price).replace(',', '.');

        if (!/^\d*(\.\d+)?$/i.test(priceString)) {
            return false;
        }

        var priceFloat = parseFloat(priceString);
        return isNaN(priceFloat) ? false : priceFloat;
    }
    return {
        getProductIdFromCode: getProductIdFromCode,
        getUniqueValues: getUniqueValues,
        isValidProductId: isValidProductId,
        getValidatedPrice: getValidatedPrice,
        _trimAllSpaces: _trimAllSpaces,
        requestProductIdFromApi: requestProductIdFromApi,
        isCartNotEmpty: isCartNotEmpty,
        isComparisonGroup: isComparisonGroup,
        productHasRequiredAttributes: productHasRequiredAttributes,
        getProductStockTotal: getProductStockTotal,
        diffInHours: diffInHours
    };
}());