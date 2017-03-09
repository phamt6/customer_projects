/* global expect, describe, beforeEach, spyOn, it, site, jasmine */

describe("cubus conversion tracking", function () {

    function stripTagsFromElement(el, tags) {
        easy.utils.each(tags, function (tag) {
            easy.utils.each(el.querySelectorAll(tag), function (element) {
                element.parentNode.removeChild(element);
            });
        });
        return el;
    }

    function createDivFromPageFixture(fixture) {
        var div = document.createElement('div');
        div.innerHTML = fixture;
        stripTagsFromElement(div, ['script', 'link', 'iframe']);
        return div;
    }

    function createLocationFromUrl(url) {
        var properties = ['href', 'protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash', 'username', 'password', 'origin'];
        var a = document.createElement('a');
        a.href = url;

        var location = easy.utils.reduce(properties, function (result, property) {
            result[property] = a[property];
            return result;
        }, {});

        return location;
    }

    var conversionTests = [{
            site: 'Norway',
            tests: [{
                name: 'Transaction',
                fixture: window.fixtures.cubus_com_no_conversion,
                url: "https://cubus.com/no/butikk/Kassen/Receipt/?tid=e0c03a86f8ba43a4bec5e84e378ffb26",
                expected: {
                    "transactionId": "CU-8WN-891601",
                    "transactionTotal": "897.00",
                    "transactionProducts": [{
                        "id": "7169204_F530",
                        "price": "299.00",
                        "quantity": "1"
                    }, {
                        "id": "7169204_F494",
                        "price": "299.00",
                        "quantity": "1"
                    }, {
                        "id": "7169204_F503",
                        "price": "299.00",
                        "quantity": "1"
                    }]
                }
            }]
        }, {
            site: 'Sweden',
            tests: [{
                name: 'Transaction',
                fixture: window.fixtures.cubus_com_sv_conversion,
                url: "https://cubus.com/sv/Butik/Kassen/Receipt/?tid=50bc8859c53d4c258943580c954875d8",
                expected: {
                    "transactionId": "CU-8WS-1672693",
                    "transactionTotal": "597.00",
                    "transactionProducts": [{
                        "id": "7155041_F951",
                        "price": "249.00",
                        "quantity": "1"
                    }, {
                        "id": "7155041_F571",
                        "price": "249.00",
                        "quantity": "1"
                    }, {
                        "id": "7090046_F990",
                        "price": "99.00",
                        "quantity": "1"
                    }]
                }
            }]
        }, {
            site: 'Finland',
            tests: [{
                name: 'Transaction',
                fixture: window.fixtures.cubus_com_fi_conversion,
                url: "https://cubus.com/fi/Butik/Kassen/Receipt/?tid=b3484850b90440be9f8995258973657c",
                expected: {
                    "transactionId": "CU-8WF-1629034",
                    "transactionTotal": "45.85",
                    "transactionProducts": [{
                        "id": "7193794_F003",
                        "price": "19.95",
                        "quantity": "1"
                    }, {
                        "id": "7193794_F990",
                        "price": "19.95",
                        "quantity": "1"
                    }]
                }
            }]
        }, {
            site: 'Germany',
            tests: [{
                name: 'Transaction',
                fixture: window.fixtures.cubus_com_de_conversion,
                url: "https://cubus.com/de/Butik/Kassen/Receipt/?tid=2bf4a8c7207048e3813f1e3f70b886ac",
                expected: {
                    "transactionId": "CU-8WG-1680602",
                    "transactionTotal": "22.85",
                    "transactionProducts": [{
                        "id": "7186321_F990",
                        "price": "6.95",
                        "quantity": "1"
                    }, {
                        "id": "7154084_F991",
                        "price": "9.95",
                        "quantity": "1"
                    }]
                }
            }]
        }

    ];

    var customConversionTests = [{
        site: 'Norway',
        tests: [{
            name: 'ClickedCheckout - desktop',
            fixture: window.fixtures.cubus_com_no_conversion_checkout,
            expected: {
                "conversionId": "clickedCheckout",
                "conversionType": "clickedCheckout",
                "conversionValue": 1,
                "frosmoConversionName": "ClickedCheckoutDesktop1"
            }
        }, {
            name: 'ClickedCheckout - mobile',
            fixture: window.fixtures.cubus_com_no_conversion_checkout_mobile,
            expected: {
                "conversionId": "clickedCheckout",
                "conversionType": "clickedCheckout",
                "conversionValue": 1,
                "frosmoConversionName": "ClickedCheckoutMobile1"
            }
        }]
    }, {
        site: 'Sweden',
        tests: [{
            name: 'ClickedCheckout - desktop',
            fixture: window.fixtures.cubus_com_sv_conversion_checkout,
            expected: {
                "conversionId": "clickedCheckout",
                "conversionType": "clickedCheckout",
                "conversionValue": 1,
                "frosmoConversionName": "ClickedCheckoutDesktop1"
            }
        }, {
            name: 'ClickedCheckout - mobile',
            fixture: window.fixtures.cubus_com_sv_conversion_checkout_mobile,
            expected: {
                "conversionId": "clickedCheckout",
                "conversionType": "clickedCheckout",
                "conversionValue": 1,
                "frosmoConversionName": "ClickedCheckoutMobile1"
            }
        }]
    }];

    beforeEach(function () {
        site = frosmo.site = frosmo.sites.cubus_com_sv;
        //site.config = null;
        spyOn(easy.events, 'trigger');
        spyOn(easy.dataLayer, 'handleItem'); // Overwrite actual product data api call
        spyOn(easy.domElements, 'isVisible').and.returnValue(true);
        easy.events.clear();
    });


    easy.utils.each(conversionTests, function (country) {
        easy.utils.each(country.tests, function (test) {
            it('should parse all ' + country.site + ' - ' + test.name + ' - conversions correctly', function () {
                var transactionPage = document.body.appendChild(createDivFromPageFixture(test.fixture));

                jasmine.window = {
                    location: createLocationFromUrl(test.url)
                };

                site.conversions._handleReceiptPage();
                expect(easy.dataLayer.handleItem).toHaveBeenCalledWith(jasmine.objectContaining(test.expected));

                transactionPage.parentNode.removeChild(transactionPage);
            });
        });
    });

    easy.utils.each(customConversionTests, function (country) {
        easy.utils.each(country.tests, function (test) {
            xit('should parse all ' + country.site + ' - ' + test.name + ' - custom conversions correctly', function () {
                var transactionPage = document.body.appendChild(createDivFromPageFixture(test.fixture));
                var els = document.querySelectorAll(site.conversions.LINK_SELECTOR);

                jasmine.window = {
                    location: createLocationFromUrl(test.url)
                };

                site.conversions._trackDirectLinkConversion();

                easy.utils.each(els, function (el) {
                    easy.domEvents.fire(el, 'click');
                });

                expect(easy.dataLayer.handleItem).toHaveBeenCalledWith(jasmine.objectContaining(test.expected));

                transactionPage.parentNode.removeChild(transactionPage);

            });
        });
    });
});