//  Get your api key by contacting me on discord kukki#3914
//  
//  Purpose of having own api key is so that I can contact/block people with excessive traffic.
//  If you use api key not bound to your name you might find yourself blocked at some point without warning.
var JANICE_API_KEY = 'G9KwKq3465588VPd6747t95Zh94q3W2E';

var JaniceUtils = (function() {
  var API_URL = 'https://janice.e-351.com/api/rest/v2';
  var MARKETS = {
    'jita': 2,
    'r1o-gn': 3,
    'perimeter': 4,
    'jitameter': 5,
    'npc': 6,
    'mj-5f9': 114,
    'amarr': 115
  };
  
  function fetch_(url, options, cacheBuster) {
    var cache = CacheService.getScriptCache();
    
    var requestHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify({ url: url, options: options, cacheBuster: cacheBuster })));
    
    var cachedResponseString = cache.get(requestHash);
    if (cachedResponseString != null) {
      return cachedResponseString;
    }
    
    Utilities.sleep(Math.random() * 2000);
    
    var response = UrlFetchApp.fetch(url, options);  
    var responseString = response.getContentText();
    
    cache.put(requestHash, responseString, 21600);
    
    return responseString;
  }
  
  function fetch_json_(url, options, cacheBuster) {
    var responseString = fetch_(url, options, cacheBuster);
    
    return JSON.parse(responseString);
  }
  
  function transpose_(a) {
    return Object.keys(new Array(a[0].length).fill()).map(function (c) { return a.map(function (r) { return r[c]; }); });
  }

  function to_string_(value) {
    if (typeof value === 'string') {
      return value;
    } else if (value === undefined || value === null) {
      return '';
    } else {
      return value.toString();
    }
  }
  
  function find_(where, what, by) {
    if (!Array.isArray(where)) {
      return null;
    }

    what = to_string_(what).toUpperCase();

    for (var i = 0; i < where.length; i++) {
      for (var ki = 0; ki < by.length; ki++) {
        var value = navigate_(where[i], by[ki]);
        
        if (to_string_(value).toUpperCase() === what) {
          return where[i];
        }
      }
    }
    
    return null;
  }
  
  function navigate_(data, key) {
    if (typeof key === 'string') {
      key = key.split(/[\.\[\]]/gi).filter(function (x) { return x.length > 0; });
    } else {
      throw new Error('Function \'navigate_\' expects parameter \'key\' to be a string');
    }
    
    for (var i = 0; i < key.length; i++) {
      if (typeof data !== 'object') {
        return null;
      }
      
      data = data[key[i]];
    }
    
    return data;
  }
  
  function format_row_(data, spec) {
    var result = [];
    for (var i = 0; i < spec.length; i++) {
      result[i] = navigate_(data, spec[i]);
    }
    return result;
  }
  
  function Range(items) {
    this.mode = 'error';
    this.input = [];
    
    if (Array.isArray(items)) {
      this.mode = 'row';
      if (items.length === 1) {
        var row = items[0];
        if (Array.isArray(row)) {
          for (var i = 0; i < row.length; i++) {
            var value = row[i];
            if ((typeof value === 'string' && value.length > 0) || typeof value === 'number') {
              this.input[i] = value.toString().trim();
            }
          }
        }
      } else {
        this.mode = 'column';
        var column = items;
        for (var i = 0; i < column.length; i++) {
          var row = column[i];
          if (Array.isArray(row) && row.length === 1) {
            var value = row[0];
            if ((typeof value === 'string' && value.length > 0) || typeof value === 'number') {
              this.input[i] = value.toString().trim();
            }
          } else {
            this.mode = 'error';
            break;
          }
        }
      }
    } else if ((typeof items === 'string' && items.length > 0) || typeof items === 'number') {
      this.mode = 'single';
      this.input[0] = items.toString().trim();
    } 
    
    if (this.mode === 'error') {
      throw new Error('Parameter \'items\' must be a single dimensional range.');
    }
    
    this.output = [];
    for (var i = 0; i < this.input.length; i++) {
      this.output.push([""]);
    }
  }
  
  Range.prototype.getResult = function () {  
    if (this.mode === 'single' || this.mode === 'column') {
      return this.output;
    } else if (this.mode === 'row') {
      return transpose_(this.output);
    } else {
      throw new Error('Invalid mode \'' + this.mode + '\'');
    }  
  }
  
  return {
    API_URL: API_URL,
    MARKETS: MARKETS,
    
    fetch: fetch_,
    fetchJson: fetch_json_,
    
    transpose: transpose_,
    find: find_,
    navigate: navigate_,
    formatRow: format_row_,
    
    Range: Range,
  };
})();

/**
 * Return pricing information for given single dimensional item range.
 *
 * @param {range} items Items to be appraised. Either type name or type id can be used.
 * @param {string?} spec Column specification. Example: "itemType.eid|itemType.name|immediatePrices.buyPrice|immediatePrices.sellPrice"
 * @param {string?} market Market, options: "jita", "perimeter", "r1o-gn".
 * @param {string?} cacheBuster String to break through cache.
 * @customfunction
 */
function JANICE_PRICER(items, spec, market, cacheBuster) {
  var range = new JaniceUtils.Range(items);
  
  if (range.input.length <= 0) {
    return [null];
  }
  
  if (typeof spec === 'string' && spec.length > 0) {
    spec = spec.split('|');
  } else {
    spec = ['immediatePrices.buyPrice', 'immediatePrices.sellPrice'];
  }
  
  if (typeof market === 'string') {
    market = JaniceUtils.MARKETS[market.toLowerCase()]
    if (!market) {
      throw new Error('invalid market');
    }
  } else {
    market = JaniceUtils.MARKETS['jita'];
  }
  
  if (!cacheBuster) {
    cacheBuster = '-';
  }
  
  var url = JaniceUtils.API_URL + '/pricer?market=' + encodeURIComponent(market) + '&_=' + encodeURIComponent(cacheBuster);

  var data = JaniceUtils.fetchJson(url, { 
    method: 'post',
    contentType: "text/plain",
    headers: {
      'X-ApiKey': JANICE_API_KEY,
    },
    payload: range.input.join('\n'),
  });
  
  for (var i = 0; i < range.input.length; i++) {
    var input = range.input[i];
    if (typeof input !== 'string' && typeof input !== 'number') {
      continue;
    }
    
    var typeInfo = JaniceUtils.find(data, input, ['itemType.eid', 'itemType.name']);
    if (!typeInfo) {
      continue;
    }
    
    range.output[i] = JaniceUtils.formatRow(typeInfo, spec);
  }

  return range.getResult();
}

/**
 * Obtain base job cost for specified items.
 *
 * @param {range} items Items to be evaluated. Either type name or type id can be used.
 * @param {string?} activity Activity, options: "manufacturing", "researchingtimeefficiency", "researchingmaterialefficiency", "copying", "invention", "reactions"
 * @param {string?} spec Column specification. Example: "itemType.eid|itemType.name|baseJobCost"
 * @param {string?} cacheBuster String to break through cache.
 * @customfunction
 */
function JANICE_BASE_JOB_COST(items, activity, spec, cacheBuster) {
  var range = new JaniceUtils.Range(items);

  if (range.input.length <= 0) {
    return [null];
  }

  if (typeof spec === 'string' && spec.length > 0) {
    spec = spec.split('|');
  } else {
    spec = ['baseJobCost'];
  }
  
  if (!cacheBuster) {
    cacheBuster = '-';
  }
  
  var url = JaniceUtils.API_URL + '/industry/base-job-cost?activity=' + encodeURIComponent(activity) + '&_=' + encodeURIComponent(cacheBuster);
  
  var data = JaniceUtils.fetchJson(url, { 
    method: 'post',
    contentType: "text/plain",
    headers: {
      'X-ApiKey': JANICE_API_KEY,
    },
    payload: range.input.join('\n'),
  });

  for (var i = 0; i < range.input.length; i++) {
    var input = range.input[i];
    if (typeof input !== 'string' && typeof input !== 'number') {
      continue;
    }
    
    var typeInfo = JaniceUtils.find(data, input, ['itemType.eid', 'itemType.name']);
    if (!typeInfo) {
      range.output[i] = new Array(spec.length);
      continue;
    }
    
    range.output[i] = JaniceUtils.formatRow(typeInfo, spec);
  }

  return range.getResult();
}
