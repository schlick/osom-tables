/**
 * The OsomTables scriptery
 *
 * Copyright (C) 2013 Nikolay Nemshilov
 */
(function($) {

  if (!$) { return console.log("No jQuery? Osom!"); }

  var current_table = null;

  // Event Listeners
  // ==========================================================================
  $(document).on('click', '.osom-table .pagination a', function(e) {
    e.preventDefault();
    $.osom_table($(this).closest('.osom-table'), this.getAttribute('href'));
  });

  $(document).on('click', '.osom-table th[data-order]', function(e) {
    order_table(this);
  });

  /* Load async tables */
  $(document).ready(function() {
    update_table_urls_from_query_string();
    load_tables('.osom-table .async');
  });

  $(window).on('popstate', function(e) {
    update_table_urls_from_query_string();
    load_tables('.osom-table > table[data-push]');
  });

  // Event Handlers
  // ==========================================================================

  // Fetches data and populates table based on order link clicked
  function order_table(order_link) {
    var order = $(order_link).data('order'), asc = $(order_link).hasClass('asc');

    $.osom_table($(order_link).closest('.osom-table'), build_url(
      $(order_link).closest('table').data('url'), {
        order: order + (asc ? '_desc' : ''), page: 1
      }
    ));
  }

  // Finds all osom-tables with a url stored in the query string, and updates
  // their data-url attribute
  function update_table_urls_from_query_string() {
    url_object = get_query_params();
    for (var key in url_object) {
      table_match = key.match(/osom-tables\[(.+)\]/)
      if (table_match !== null) {
        $("#" + table_match[1]).data('url', url_object[key])
      }
    }
  }

  function load_tables(finder) {
    $(finder).each(function(index, element) {
      var table = $(element);
      return $.osom_table(table.closest('.osom-table'), table.data('url'), true);
    });
  }

  // Public Functions
  // ==========================================================================

  var osom_table = $.fn.osom_table = $.osom_table = function(container, url, no_push) {
    current_table = container.addClass('loading');
    actual_table  = container.find('table');
    var table_id = actual_table.attr('id');

    actual_table.trigger('osom-table:request');

    if (history.pushState && !no_push && actual_table.data('push')) {
      push_table_state(table_id, url);
    }

    $.ajax(url, {
      cache: false,
      success: function(new_content) {
        table_load_success(container, new_content, url)
      },
      complete: function() {
        container.removeClass('loading');
        actual_table.trigger('osom-table:loaded');
      }
    });
  };

  // Helper Functions
  // ==========================================================================

  // Pushes the table's state/url to history
  function push_table_state(table_id, url) {
    url_object = get_query_params();
    url_object['osom-tables[' + table_id + ']'] = url;

    combined_url = current_pathname + "?" + $.param(url_object);

    history.pushState({url: combined_url}, 'osom-table', combined_url);
    url = build_url(url, {osom_tables_cache_killa: true});
  }

  // Callback for successful ajax load of table data
  function table_load_success(container, new_content, url) {
    var new_container = $(new_content);
    container.html($(new_content).children());

    var actual_table = new_container.find('table');
    actual_table.data('url', url);

    if (new_container.find('tbody').children().length > 0) {
      container.removeClass('empty');
    }
  }

  // URL Functions
  // ==========================================================================

  function get_query_params() {
    current_pathname = window.location.pathname;
    current_search = window.location.search;

    return parse_url(current_pathname + current_search)[1];
  }

  /**
   * Rebuilds the url with the extra prams
   */
  function build_url(url, params) {
    var path, args; path = parse_url(url);
    args = path[1]; path = path[0];

    for (var key in params) {
      args[key] = params[key];
    }

    return path + "?" + $.param(args);
  }

  /**
   * Parsing the arguments out of the url query
   */
  function parse_url(url) {
    var path, query, args={}, list, key, value;
    path = url.split("?"); query = path[1]; path = path[0];

    if (query) {
      for (var i=0, list = query.split('&'); i < list.length; i++) {
        key   = list[i].split('=');
        value = key[1]; key = key[0];

        key   = decodeURIComponent(key);
        value = decodeURIComponent((value||'').replace(/\+/g, ' '));

        if (key.substr(-2) === "[]") {
          if (args[key]) {
            args[key].push(value)
          } else {
            args[key] = [value]
          }
        } else {
          args[key] = value
        }
      }
    }

    return [path, args];
  }

})(jQuery);