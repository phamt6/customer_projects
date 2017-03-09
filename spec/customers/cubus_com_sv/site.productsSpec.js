/* global expect, describe, beforeEach, spyOn, it, site, jasmine */

describe("cubus product tracking", function () {

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

    var productTests = [{
        site: 'Norway',
        tests: [{
            name: 'Product',
            fixture: window.fixtures.cubus_com_no_product,
            url: "https://cubus.com/no/7195692_F921",
            expected: {
                id: "7195692_F921",
                name: "",
                price: "",
                type: "",
                image: "https://cubus.com/globalassets/productimages/7050221478976_f_7195692_l_olive_sweat.jpg?preset=productlist",
                url: ""
            }
        }]
    }, {
        site: 'Sweden',
        tests: [{
            name: 'Product',
            fixture: window.fixtures.cubus_com_sv_product,
            url: "https://cubus.com/sv/7131679_F000",
            expected: {
                id: "7131679_F000",
                name: "",
                price: "",
                type: "",
                image: "https://cubus.com/globalassets/productimages/7050215504506_f_7131679_u_2_x_washingbag1.jpg?preset=productlist",
                url: ""
            }
        }]
    }, {
        site: 'Finland',
        tests: [{
            name: 'Product',
            fixture: window.fixtures.cubus_com_fi_product,
            url: "https://cubus.com/fi/7138693_F951",
            expected: {
                id: "7138693_F951",
                name: "",
                price: "",
                type: "",
                image: "https://cubus.com/globalassets/productimages/7050216546383_f_7138693_chb_basic_jog_pant1.jpg?preset=productlist",
                url: ""
            }
        }]
    }, {
        site: 'Germany',
        tests: [{
            name: 'Product',
            fixture: window.fixtures.cubus_com_de_product,
            url: "https://cubus.com/de/7164460_F900",
            expected: {
                id: "7164460_F900",
                name: "",
                price: "",
                type: "",
                image: "https://cubus.com/globalassets/productimages/7050219128050_f_7164460_chb_basic_t_shirt1.jpg?preset=productlist",
                url: ""
            }
        }]
    }];

    beforeEach(function () {
        site = frosmo.site = frosmo.sites.cubus_com_sv;
        site.config = {};
        site.productParser = frosmo.sites._utils.productParser;
        spyOn(easy.api, 'setProductData'); // Overwrite actual product data api call
        spyOn(easy.events, 'trigger');
        easy.events.clear();
    });


    easy.utils.each(productTests, function (country) {
        easy.utils.each(country.tests, function (test) {
            it('should parse all ' + country.site + ' ' + test.name + ' products correctly', function () {
                var productPage = document.body.appendChild(createDivFromPageFixture(test.fixture));

                jasmine.window = {
                    location: createLocationFromUrl(test.url)
                };

                site.products.init();
                site.products._handleProductPage();

                expect(easy.events.trigger).toHaveBeenCalledWith(easy.EVENT_PRODUCT_DATA, jasmine.objectContaining(test.expected));
                productPage.parentNode.removeChild(productPage);
            });

        });
    });

});