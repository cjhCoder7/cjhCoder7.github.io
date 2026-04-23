/**
 * Common utilities: lazy loading, tooltips, and masonry grid.
 * Template: https://github.com/luost26/academic-homepage
 */
$(function () {
    var lazyLoadOptions = {
        scrollDirection: 'vertical',
        effect: 'fadeIn',
        effectTime: 300,
        placeholder: '',
        onError: function (element) {
            console.log('[lazyload] Error loading ' + element.data('src'));
        },
        afterLoad: function (element) {
            if (element.is('img')) {
                element.css('background-image', 'none');
            } else if (element.is('div')) {
                element.css('background-size', 'cover');
                element.css('background-position', 'center');
            }
        }
    };

    $('img.lazy, div.lazy:not(.always-load)').Lazy({ visibleOnly: true, ...lazyLoadOptions });
    $('div.lazy.always-load').Lazy({ visibleOnly: false, ...lazyLoadOptions });

    $('[data-toggle="tooltip"]').tooltip();

    var $grid = $('.grid').masonry({
        percentPosition: true,
        itemSelector: '.grid-item',
        columnWidth: '.grid-sizer'
    });

    // Layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });

    $('.lazy').on('load', function () {
        $grid.masonry('layout');
    });
});
