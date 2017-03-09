/*global site*/

// --------------------------------------
// customsegment.js configuration options
// --------------------------------------

// Here are configuration options that can be set from the ui or database
// If you need these options, just uncomment the following line
// Note: More documentation can be found in the Developers Guide

// Load xdm iframe to head, which is faster but not standard compliant
// easy.config.xdmIframeInHead = true;

// Track clicks for hidden messages
easy.config.hiddenMessageClickTracking = true;

// Enable contextApi which allows saving and retrieving from the server
// Needed for Apple devices when shared context is enabled
// easy.config.contextApi = true;

// When contextApi is used and the site uses multiple different subdomains,
// you'll need to define base domain here
// easy.config.cookieDomain = "customer.domain.com";

site.config = {
    customApiUrl: '//cubus_com_no_api.frosmo.com',
    translations: {
        soldOutOnline: 'UTSOLGT PÅ NETT',
        findProductInStore: 'FINN PRODUKTET I BUTIKK'
    }
};