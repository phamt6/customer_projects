// Init renderers for Quick Messages
// site.quickRenderers.init();

site.init = function () {
    easy.console.log('customsegment init');

    // Init renderer modules
    easy.utils.each(Object.keys(site.renderers), function (renderer) {
        site.renderers[renderer].init();
    });

    // Init modules
    site.templateFormatters.init();
    site.events.init();
    site.products.init();
    site.conversions.init();
    site.userTracking.init();
    // site.customActions.init();
};