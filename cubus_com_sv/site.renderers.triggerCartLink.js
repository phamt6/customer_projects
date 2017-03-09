site.renderers = site.renderers || {};

site.renderers.triggerCartLink = (function () {
    var MODULE = '[site.renderers.triggerCartLink]';

    /**
     * wait for event TRIGGER_CART_LINK_DESKTOP, insertHTML and make frosmo message as invisible/visible conditionally
     * @return {false}                when user is in comparison group
     */
    function triggerCartLinkForDesktop(positionData, message, el, cb) {
        easy.events.on(site.events.TRIGGER_CART_LINK_DESKTOP, function () {
            if (site.utils.isComparisonGroup()) {
                cb();
            }
            el.style.display = 'inline-block';
            easy.domElements.insertHtml(el, message.content);
            cb();
        });

        easy.events.on(site.events.HIDE_TRIGGER_CART_LINK_DESKTOP, function () {
            el.style.display = 'none';
        });
    }

    /**
     * wait for event TRIGGER_CART_LINK_MOBILE, insertHTML and make frosmo message as invisible/visible conditionally
     * @return {false}                when user is in comparison group
     */
    function triggerCartLinkForMobile(positionData, message, el, cb) {
        easy.events.on(site.events.TRIGGER_CART_LINK_MOBILE, function () {
            if (site.utils.isComparisonGroup()) {
                cb();
            }
            el.style.display = 'inline-block';
            easy.domElements.insertHtml(el, message.content);
            cb();
        });

        easy.events.on(site.events.HIDE_TRIGGER_CART_LINK_MOBILE, function () {
            el.style.display = 'none';
        });
    }

    function init() {
        easy.console.log(MODULE, 'initialization');

        easy.messageShow.addCustomRenderer('triggerCartLinkForDesktop.hidden', triggerCartLinkForDesktop);
        easy.messageShow.addCustomRenderer('triggerCartLinkForDesktop', triggerCartLinkForDesktop);

        easy.messageShow.addCustomRenderer('triggerCartLinkForMobile.hidden', triggerCartLinkForMobile);
        easy.messageShow.addCustomRenderer('triggerCartLinkForMobile', triggerCartLinkForMobile);
    }

    return {
        init: init
    };
}());