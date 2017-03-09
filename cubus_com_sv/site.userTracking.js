/**
 * @namespace
 */
site.userTracking = (function () {
    var MODULE = '[site.userTracking]';

    /**
     * Get cateogry type (CUBW,CUBM) for main category (DAM/HERR)
     */
    function getCategoryType(categoryName) {
        return easy.utils.find(Object.keys(site.config.translations.categories), function (key) {
            var matcher = new RegExp(categoryName, 'gi');
            return site.config.translations.categories[key].match(matcher);
        });
    }

    /**
     * (CUBUS-36) Search optimisation with elastic search
     * Track users last visited main category
     */
    function trackLastVisitedCategory() {
        var pageCategory = window.location.pathname.split('/')[2];
        var categoryType = getCategoryType(pageCategory);
        if (!categoryType) {
            return;
        }
        frosmo.easy.context.site.lastVisitedCategory = categoryType;
        frosmo.easy.context.save();
    }

    /**
     * Initialize the Custom Actions module
     *
     * @memberof site.userTracking
     */
    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.events.on(site.events.CATEGORY_PAGE_VIEW, trackLastVisitedCategory);
        easy.events.on(site.events.PRODUCTLIST_PAGE_VIEW, trackLastVisitedCategory);
    }


    return {
        init: init
    };
}());