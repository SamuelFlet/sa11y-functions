(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Sa11y = {}));
})(this, (function (exports) { 'use strict';

  var top = 'top';
  var bottom = 'bottom';
  var right = 'right';
  var left = 'left';
  var auto = 'auto';
  var basePlacements = [top, bottom, right, left];
  var start = 'start';
  var end = 'end';
  var clippingParents = 'clippingParents';
  var viewport = 'viewport';
  var popper = 'popper';
  var reference = 'reference';
  var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
    return acc.concat([placement + "-" + start, placement + "-" + end]);
  }, []);
  var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
    return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
  }, []); // modifiers that need to read the DOM

  var beforeRead = 'beforeRead';
  var read = 'read';
  var afterRead = 'afterRead'; // pure-logic modifiers

  var beforeMain = 'beforeMain';
  var main = 'main';
  var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

  var beforeWrite = 'beforeWrite';
  var write = 'write';
  var afterWrite = 'afterWrite';
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  function getNodeName(element) {
    return element ? (element.nodeName || '').toLowerCase() : null;
  }

  function getWindow(node) {
    if (node == null) {
      return window;
    }

    if (node.toString() !== '[object Window]') {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }

    return node;
  }

  function isElement$1(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }

  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }

  function isShadowRoot(node) {
    // IE 11 has no ShadowRoot
    if (typeof ShadowRoot === 'undefined') {
      return false;
    }

    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // and applies them to the HTMLElements such as popper and arrow

  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function (name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name]; // arrow is optional + virtual elements

      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      } // Flow doesn't support to extend this property, but it's the most
      // effective way to apply styles to an HTMLElement
      // $FlowFixMe[cannot-write]


      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (name) {
        var value = attributes[name];

        if (value === false) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value === true ? '' : value);
        }
      });
    });
  }

  function effect$2(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: '0',
        top: '0',
        margin: '0'
      },
      arrow: {
        position: 'absolute'
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;

    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }

    return function () {
      Object.keys(state.elements).forEach(function (name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

        var style = styleProperties.reduce(function (style, property) {
          style[property] = '';
          return style;
        }, {}); // arrow is optional + virtual elements

        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }

        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  } // eslint-disable-next-line import/no-unused-modules


  var applyStyles$1 = {
    name: 'applyStyles',
    enabled: true,
    phase: 'write',
    fn: applyStyles,
    effect: effect$2,
    requires: ['computeStyles']
  };

  function getBasePlacement$1(placement) {
    return placement.split('-')[0];
  }

  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  function getBoundingClientRect(element, includeScale) {
    if (includeScale === void 0) {
      includeScale = false;
    }

    var rect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;

    if (isHTMLElement(element) && includeScale) {
      var offsetHeight = element.offsetHeight;
      var offsetWidth = element.offsetWidth; // Do not attempt to divide by 0, otherwise we get `Infinity` as scale
      // Fallback to 1 in case both values are `0`

      if (offsetWidth > 0) {
        scaleX = round(rect.width) / offsetWidth || 1;
      }

      if (offsetHeight > 0) {
        scaleY = round(rect.height) / offsetHeight || 1;
      }
    }

    return {
      width: rect.width / scaleX,
      height: rect.height / scaleY,
      top: rect.top / scaleY,
      right: rect.right / scaleX,
      bottom: rect.bottom / scaleY,
      left: rect.left / scaleX,
      x: rect.left / scaleX,
      y: rect.top / scaleY
    };
  }

  // means it doesn't take into account transforms.

  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
    // Fixes https://github.com/popperjs/popper-core/issues/1223

    var width = element.offsetWidth;
    var height = element.offsetHeight;

    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }

    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }

    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: width,
      height: height
    };
  }

  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

    if (parent.contains(child)) {
      return true;
    } // then fallback to custom implementation with Shadow DOM support
    else if (rootNode && isShadowRoot(rootNode)) {
        var next = child;

        do {
          if (next && parent.isSameNode(next)) {
            return true;
          } // $FlowFixMe[prop-missing]: need a better way to handle this...


          next = next.parentNode || next.host;
        } while (next);
      } // Give up, the result is false


    return false;
  }

  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }

  function isTableElement(element) {
    return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
  }

  function getDocumentElement(element) {
    // $FlowFixMe[incompatible-return]: assume body is always available
    return ((isElement$1(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
    element.document) || window.document).documentElement;
  }

  function getParentNode(element) {
    if (getNodeName(element) === 'html') {
      return element;
    }

    return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
      // $FlowFixMe[incompatible-return]
      // $FlowFixMe[prop-missing]
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || ( // DOM Element detected
      isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
      // $FlowFixMe[incompatible-call]: HTMLElement is a Node
      getDocumentElement(element) // fallback

    );
  }

  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle$1(element).position === 'fixed') {
      return null;
    }

    return element.offsetParent;
  } // `.offsetParent` reports `null` for fixed elements, while absolute elements
  // return the containing block


  function getContainingBlock(element) {
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
    var isIE = navigator.userAgent.indexOf('Trident') !== -1;

    if (isIE && isHTMLElement(element)) {
      // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
      var elementCss = getComputedStyle$1(element);

      if (elementCss.position === 'fixed') {
        return null;
      }
    }

    var currentNode = getParentNode(element);

    while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle$1(currentNode); // This is non-exhaustive but covers the most common CSS properties that
      // create a containing block.
      // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

      if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }

    return null;
  } // Gets the closest ancestor positioned element. Handles some edge cases,
  // such as table ancestors and cross browser bugs.


  function getOffsetParent(element) {
    var window = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);

    while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
      offsetParent = getTrueOffsetParent(offsetParent);
    }

    if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static')) {
      return window;
    }

    return offsetParent || getContainingBlock(element) || window;
  }

  function getMainAxisFromPlacement(placement) {
    return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
  }

  function within(min$1, value, max$1) {
    return max(min$1, min(value, max$1));
  }
  function withinMaxClamp(min, value, max) {
    var v = within(min, value, max);
    return v > max ? max : v;
  }

  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }

  function expandToHashMap(value, keys) {
    return keys.reduce(function (hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  var toPaddingObject = function toPaddingObject(padding, state) {
    padding = typeof padding === 'function' ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
  };

  function arrow(_ref) {
    var _state$modifiersData$;

    var state = _ref.state,
        name = _ref.name,
        options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement$1(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? 'height' : 'width';

    if (!arrowElement || !popperOffsets) {
      return;
    }

    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === 'y' ? top : left;
    var maxProp = axis === 'y' ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
    var startDiff = popperOffsets[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
    // outside of the popper bounds

    var min = paddingObject[minProp];
    var max = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset = within(min, center, max); // Prevents breaking syntax highlighting...

    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
  }

  function effect$1(_ref2) {
    var state = _ref2.state,
        options = _ref2.options;
    var _options$element = options.element,
        arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element;

    if (arrowElement == null) {
      return;
    } // CSS selector


    if (typeof arrowElement === 'string') {
      arrowElement = state.elements.popper.querySelector(arrowElement);

      if (!arrowElement) {
        return;
      }
    }

    if (!contains(state.elements.popper, arrowElement)) {

      return;
    }

    state.elements.arrow = arrowElement;
  } // eslint-disable-next-line import/no-unused-modules


  var arrow$1 = {
    name: 'arrow',
    enabled: true,
    phase: 'main',
    fn: arrow,
    effect: effect$1,
    requires: ['popperOffsets'],
    requiresIfExists: ['preventOverflow']
  };

  function getVariation(placement) {
    return placement.split('-')[1];
  }

  var unsetSides = {
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto'
  }; // Round the offsets to the nearest suitable subpixel based on the DPR.
  // Zooming can change the DPR, but it seems to report a value that will
  // cleanly divide the values into the appropriate subpixels.

  function roundOffsetsByDPR(_ref) {
    var x = _ref.x,
        y = _ref.y;
    var win = window;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(x * dpr) / dpr || 0,
      y: round(y * dpr) / dpr || 0
    };
  }

  function mapToStyles(_ref2) {
    var _Object$assign2;

    var popper = _ref2.popper,
        popperRect = _ref2.popperRect,
        placement = _ref2.placement,
        variation = _ref2.variation,
        offsets = _ref2.offsets,
        position = _ref2.position,
        gpuAcceleration = _ref2.gpuAcceleration,
        adaptive = _ref2.adaptive,
        roundOffsets = _ref2.roundOffsets,
        isFixed = _ref2.isFixed;
    var _offsets$x = offsets.x,
        x = _offsets$x === void 0 ? 0 : _offsets$x,
        _offsets$y = offsets.y,
        y = _offsets$y === void 0 ? 0 : _offsets$y;

    var _ref3 = typeof roundOffsets === 'function' ? roundOffsets({
      x: x,
      y: y
    }) : {
      x: x,
      y: y
    };

    x = _ref3.x;
    y = _ref3.y;
    var hasX = offsets.hasOwnProperty('x');
    var hasY = offsets.hasOwnProperty('y');
    var sideX = left;
    var sideY = top;
    var win = window;

    if (adaptive) {
      var offsetParent = getOffsetParent(popper);
      var heightProp = 'clientHeight';
      var widthProp = 'clientWidth';

      if (offsetParent === getWindow(popper)) {
        offsetParent = getDocumentElement(popper);

        if (getComputedStyle$1(offsetParent).position !== 'static' && position === 'absolute') {
          heightProp = 'scrollHeight';
          widthProp = 'scrollWidth';
        }
      } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


      offsetParent = offsetParent;

      if (placement === top || (placement === left || placement === right) && variation === end) {
        sideY = bottom;
        var offsetY = isFixed && win.visualViewport ? win.visualViewport.height : // $FlowFixMe[prop-missing]
        offsetParent[heightProp];
        y -= offsetY - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }

      if (placement === left || (placement === top || placement === bottom) && variation === end) {
        sideX = right;
        var offsetX = isFixed && win.visualViewport ? win.visualViewport.width : // $FlowFixMe[prop-missing]
        offsetParent[widthProp];
        x -= offsetX - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }

    var commonStyles = Object.assign({
      position: position
    }, adaptive && unsetSides);

    var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
      x: x,
      y: y
    }) : {
      x: x,
      y: y
    };

    x = _ref4.x;
    y = _ref4.y;

    if (gpuAcceleration) {
      var _Object$assign;

      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
    }

    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
  }

  function computeStyles(_ref5) {
    var state = _ref5.state,
        options = _ref5.options;
    var _options$gpuAccelerat = options.gpuAcceleration,
        gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
        _options$adaptive = options.adaptive,
        adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
        _options$roundOffsets = options.roundOffsets,
        roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

    var commonStyles = {
      placement: getBasePlacement$1(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration: gpuAcceleration,
      isFixed: state.options.strategy === 'fixed'
    };

    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive: adaptive,
        roundOffsets: roundOffsets
      })));
    }

    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: 'absolute',
        adaptive: false,
        roundOffsets: roundOffsets
      })));
    }

    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      'data-popper-placement': state.placement
    });
  } // eslint-disable-next-line import/no-unused-modules


  var computeStyles$1 = {
    name: 'computeStyles',
    enabled: true,
    phase: 'beforeWrite',
    fn: computeStyles,
    data: {}
  };

  var passive = {
    passive: true
  };

  function effect(_ref) {
    var state = _ref.state,
        instance = _ref.instance,
        options = _ref.options;
    var _options$scroll = options.scroll,
        scroll = _options$scroll === void 0 ? true : _options$scroll,
        _options$resize = options.resize,
        resize = _options$resize === void 0 ? true : _options$resize;
    var window = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.addEventListener('scroll', instance.update, passive);
      });
    }

    if (resize) {
      window.addEventListener('resize', instance.update, passive);
    }

    return function () {
      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.removeEventListener('scroll', instance.update, passive);
        });
      }

      if (resize) {
        window.removeEventListener('resize', instance.update, passive);
      }
    };
  } // eslint-disable-next-line import/no-unused-modules


  var eventListeners = {
    name: 'eventListeners',
    enabled: true,
    phase: 'write',
    fn: function fn() {},
    effect: effect,
    data: {}
  };

  var hash$1 = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom'
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function (matched) {
      return hash$1[matched];
    });
  }

  var hash = {
    start: 'end',
    end: 'start'
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function (matched) {
      return hash[matched];
    });
  }

  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft: scrollLeft,
      scrollTop: scrollTop
    };
  }

  function getWindowScrollBarX(element) {
    // If <html> has a CSS width greater than the viewport, then this will be
    // incorrect for RTL.
    // Popper 1 is broken in this case and never had a bug report so let's assume
    // it's not an issue. I don't think anyone ever specifies width on <html>
    // anyway.
    // Browsers where the left scrollbar doesn't cause an issue report `0` for
    // this (e.g. Edge 2019, IE11, Safari)
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  function getViewportRect(element) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y = 0; // NB: This isn't supported on iOS <= 12. If the keyboard is open, the popper
    // can be obscured underneath it.
    // Also, `html.clientHeight` adds the bottom bar height in Safari iOS, even
    // if it isn't open, so if this isn't available, the popper will be detected
    // to overflow the bottom of the screen too early.

    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height; // Uses Layout Viewport (like Chrome; Safari does not currently)
      // In Chrome, it returns a value very close to 0 (+/-) but contains rounding
      // errors due to floating point numbers, so we need to check precision.
      // Safari returns a number <= 0, usually < -1 when pinch-zoomed
      // Feature detection fails in mobile emulation mode in Chrome.
      // Math.abs(win.innerWidth / visualViewport.scale - visualViewport.width) <
      // 0.001
      // Fallback here: "Not Safari" userAgent

      if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }

    return {
      width: width,
      height: height,
      x: x + getWindowScrollBarX(element),
      y: y
    };
  }

  // of the `<html>` and `<body>` rect bounds if horizontally scrollable

  function getDocumentRect(element) {
    var _element$ownerDocumen;

    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y = -winScroll.scrollTop;

    if (getComputedStyle$1(body || html).direction === 'rtl') {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }

    return {
      width: width,
      height: height,
      x: x,
      y: y
    };
  }

  function isScrollParent(element) {
    // Firefox wants us to check `-x` and `-y` variations as well
    var _getComputedStyle = getComputedStyle$1(element),
        overflow = _getComputedStyle.overflow,
        overflowX = _getComputedStyle.overflowX,
        overflowY = _getComputedStyle.overflowY;

    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  function getScrollParent(node) {
    if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
      // $FlowFixMe[incompatible-return]: assume body is always available
      return node.ownerDocument.body;
    }

    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }

    return getScrollParent(getParentNode(node));
  }

  /*
  given a DOM element, return the list of all scroll parents, up the list of ancesors
  until we get to the top window object. This list is what we attach scroll listeners
  to, because if any of these parent elements scroll, we'll need to re-calculate the
  reference element's position.
  */

  function listScrollParents(element, list) {
    var _element$ownerDocumen;

    if (list === void 0) {
      list = [];
    }

    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    updatedList.concat(listScrollParents(getParentNode(target)));
  }

  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  function getInnerBoundingClientRect(element) {
    var rect = getBoundingClientRect(element);
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }

  function getClientRectFromMixedType(element, clippingParent) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isElement$1(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  } // A "clipping parent" is an overflowable container with the characteristic of
  // clipping (or hiding) overflowing elements with a position different from
  // `initial`


  function getClippingParents(element) {
    var clippingParents = listScrollParents(getParentNode(element));
    var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle$1(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

    if (!isElement$1(clipperElement)) {
      return [];
    } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414


    return clippingParents.filter(function (clippingParent) {
      return isElement$1(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== 'body';
    });
  } // Gets the maximum area that the element is visible in due to any number of
  // clipping parents


  function getClippingRect(element, boundary, rootBoundary) {
    var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
    var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents[0];
    var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  function computeOffsets(_ref) {
    var reference = _ref.reference,
        element = _ref.element,
        placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement$1(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference.x + reference.width / 2 - element.width / 2;
    var commonY = reference.y + reference.height / 2 - element.height / 2;
    var offsets;

    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference.y - element.height
        };
        break;

      case bottom:
        offsets = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;

      case right:
        offsets = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;

      case left:
        offsets = {
          x: reference.x - element.width,
          y: commonY
        };
        break;

      default:
        offsets = {
          x: reference.x,
          y: reference.y
        };
    }

    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

    if (mainAxis != null) {
      var len = mainAxis === 'y' ? 'height' : 'width';

      switch (variation) {
        case start:
          offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
          break;

        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
          break;
      }
    }

    return offsets;
  }

  function detectOverflow$1(state, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        _options$placement = _options.placement,
        placement = _options$placement === void 0 ? state.placement : _options$placement,
        _options$boundary = _options.boundary,
        boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
        _options$rootBoundary = _options.rootBoundary,
        rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
        _options$elementConte = _options.elementContext,
        elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
        _options$altBoundary = _options.altBoundary,
        altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
        _options$padding = _options.padding,
        padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement$1(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: 'absolute',
      placement: placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
    // 0 or negative = within the clipping rect

    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

    if (elementContext === popper && offsetData) {
      var offset = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function (key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
        overflowOffsets[key] += offset[axis] * multiply;
      });
    }

    return overflowOffsets;
  }

  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        placement = _options.placement,
        boundary = _options.boundary,
        rootBoundary = _options.rootBoundary,
        padding = _options.padding,
        flipVariations = _options.flipVariations,
        _options$allowedAutoP = _options.allowedAutoPlacements,
        allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
      return getVariation(placement) === variation;
    }) : basePlacements;
    var allowedPlacements = placements$1.filter(function (placement) {
      return allowedAutoPlacements.indexOf(placement) >= 0;
    });

    if (allowedPlacements.length === 0) {
      allowedPlacements = placements$1;
    } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...


    var overflows = allowedPlacements.reduce(function (acc, placement) {
      acc[placement] = detectOverflow$1(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding
      })[getBasePlacement$1(placement)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function (a, b) {
      return overflows[a] - overflows[b];
    });
  }

  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement$1(placement) === auto) {
      return [];
    }

    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }

  function flip(_ref) {
    var state = _ref.state,
        options = _ref.options,
        name = _ref.name;

    if (state.modifiersData[name]._skip) {
      return;
    }

    var _options$mainAxis = options.mainAxis,
        checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
        _options$altAxis = options.altAxis,
        checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
        specifiedFallbackPlacements = options.fallbackPlacements,
        padding = options.padding,
        boundary = options.boundary,
        rootBoundary = options.rootBoundary,
        altBoundary = options.altBoundary,
        _options$flipVariatio = options.flipVariations,
        flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
        allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement$1(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
      return acc.concat(getBasePlacement$1(placement) === auto ? computeAutoPlacement(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding,
        flipVariations: flipVariations,
        allowedAutoPlacements: allowedAutoPlacements
      }) : placement);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements[0];

    for (var i = 0; i < placements.length; i++) {
      var placement = placements[i];

      var _basePlacement = getBasePlacement$1(placement);

      var isStartVariation = getVariation(placement) === start;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? 'width' : 'height';
      var overflow = detectOverflow$1(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        altBoundary: altBoundary,
        padding: padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }

      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];

      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }

      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }

      if (checks.every(function (check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }

      checksMap.set(placement, checks);
    }

    if (makeFallbackChecks) {
      // `2` may be desired in some cases – research later
      var numberOfChecks = flipVariations ? 3 : 1;

      var _loop = function _loop(_i) {
        var fittingPlacement = placements.find(function (placement) {
          var checks = checksMap.get(placement);

          if (checks) {
            return checks.slice(0, _i).every(function (check) {
              return check;
            });
          }
        });

        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };

      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);

        if (_ret === "break") break;
      }
    }

    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  } // eslint-disable-next-line import/no-unused-modules


  var flip$1 = {
    name: 'flip',
    enabled: true,
    phase: 'main',
    fn: flip,
    requiresIfExists: ['offset'],
    data: {
      _skip: false
    }
  };

  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }

    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }

  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function (side) {
      return overflow[side] >= 0;
    });
  }

  function hide(_ref) {
    var state = _ref.state,
        name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow$1(state, {
      elementContext: 'reference'
    });
    var popperAltOverflow = detectOverflow$1(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets: referenceClippingOffsets,
      popperEscapeOffsets: popperEscapeOffsets,
      isReferenceHidden: isReferenceHidden,
      hasPopperEscaped: hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      'data-popper-reference-hidden': isReferenceHidden,
      'data-popper-escaped': hasPopperEscaped
    });
  } // eslint-disable-next-line import/no-unused-modules


  var hide$1 = {
    name: 'hide',
    enabled: true,
    phase: 'main',
    requiresIfExists: ['preventOverflow'],
    fn: hide
  };

  function distanceAndSkiddingToXY(placement, rects, offset) {
    var basePlacement = getBasePlacement$1(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

    var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
      placement: placement
    })) : offset,
        skidding = _ref[0],
        distance = _ref[1];

    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }

  function offset(_ref2) {
    var state = _ref2.state,
        options = _ref2.options,
        name = _ref2.name;
    var _options$offset = options.offset,
        offset = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function (acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement],
        x = _data$state$placement.x,
        y = _data$state$placement.y;

    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }

    state.modifiersData[name] = data;
  } // eslint-disable-next-line import/no-unused-modules


  var offset$1 = {
    name: 'offset',
    enabled: true,
    phase: 'main',
    requires: ['popperOffsets'],
    fn: offset
  };

  function popperOffsets(_ref) {
    var state = _ref.state,
        name = _ref.name;
    // Offsets are the actual position the popper needs to have to be
    // properly positioned near its reference element
    // This is the most basic placement, and will be adjusted by
    // the modifiers in the next step
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: 'absolute',
      placement: state.placement
    });
  } // eslint-disable-next-line import/no-unused-modules


  var popperOffsets$1 = {
    name: 'popperOffsets',
    enabled: true,
    phase: 'read',
    fn: popperOffsets,
    data: {}
  };

  function getAltAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
  }

  function preventOverflow(_ref) {
    var state = _ref.state,
        options = _ref.options,
        name = _ref.name;
    var _options$mainAxis = options.mainAxis,
        checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
        _options$altAxis = options.altAxis,
        checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
        boundary = options.boundary,
        rootBoundary = options.rootBoundary,
        altBoundary = options.altBoundary,
        padding = options.padding,
        _options$tether = options.tether,
        tether = _options$tether === void 0 ? true : _options$tether,
        _options$tetherOffset = options.tetherOffset,
        tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow$1(state, {
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
      altBoundary: altBoundary
    });
    var basePlacement = getBasePlacement$1(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var normalizedTetherOffsetValue = typeof tetherOffsetValue === 'number' ? {
      mainAxis: tetherOffsetValue,
      altAxis: tetherOffsetValue
    } : Object.assign({
      mainAxis: 0,
      altAxis: 0
    }, tetherOffsetValue);
    var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
    var data = {
      x: 0,
      y: 0
    };

    if (!popperOffsets) {
      return;
    }

    if (checkMainAxis) {
      var _offsetModifierState$;

      var mainSide = mainAxis === 'y' ? top : left;
      var altSide = mainAxis === 'y' ? bottom : right;
      var len = mainAxis === 'y' ? 'height' : 'width';
      var offset = popperOffsets[mainAxis];
      var min$1 = offset + overflow[mainSide];
      var max$1 = offset - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
      // outside the reference bounds

      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
      // to include its full size in the calculation. If the reference is small
      // and near the edge of a boundary, the popper can overflow even if the
      // reference is not overflowing as well (e.g. virtual elements with no
      // width or height)

      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
      var tetherMin = offset + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = offset + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
      popperOffsets[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset;
    }

    if (checkAltAxis) {
      var _offsetModifierState$2;

      var _mainSide = mainAxis === 'x' ? top : left;

      var _altSide = mainAxis === 'x' ? bottom : right;

      var _offset = popperOffsets[altAxis];

      var _len = altAxis === 'y' ? 'height' : 'width';

      var _min = _offset + overflow[_mainSide];

      var _max = _offset - overflow[_altSide];

      var isOriginSide = [top, left].indexOf(basePlacement) !== -1;

      var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;

      var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;

      var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;

      var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);

      popperOffsets[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }

    state.modifiersData[name] = data;
  } // eslint-disable-next-line import/no-unused-modules


  var preventOverflow$1 = {
    name: 'preventOverflow',
    enabled: true,
    phase: 'main',
    fn: preventOverflow,
    requiresIfExists: ['offset']
  };

  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = round(rect.width) / element.offsetWidth || 1;
    var scaleY = round(rect.height) / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  } // Returns the composite rect of an element relative to its offsetParent.
  // Composite means it takes into account transforms as well as layout.


  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }

    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };

    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }

      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent, true);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }

    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  function order(modifiers) {
    var map = new Map();
    var visited = new Set();
    var result = [];
    modifiers.forEach(function (modifier) {
      map.set(modifier.name, modifier);
    }); // On visiting object, check for its dependencies and visit them recursively

    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function (dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);

          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }

    modifiers.forEach(function (modifier) {
      if (!visited.has(modifier.name)) {
        // check for visited object
        sort(modifier);
      }
    });
    return result;
  }

  function orderModifiers(modifiers) {
    // order based on dependencies
    var orderedModifiers = order(modifiers); // order based on phase

    return modifierPhases.reduce(function (acc, phase) {
      return acc.concat(orderedModifiers.filter(function (modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  function debounce$1(fn) {
    var pending;
    return function () {
      if (!pending) {
        pending = new Promise(function (resolve) {
          Promise.resolve().then(function () {
            pending = undefined;
            resolve(fn());
          });
        });
      }

      return pending;
    };
  }

  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function (merged, current) {
      var existing = merged[current.name];
      merged[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged;
    }, {}); // IE11 does not support Object.values

    return Object.keys(merged).map(function (key) {
      return merged[key];
    });
  }

  var DEFAULT_OPTIONS = {
    placement: 'bottom',
    modifiers: [],
    strategy: 'absolute'
  };

  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return !args.some(function (element) {
      return !(element && typeof element.getBoundingClientRect === 'function');
    });
  }

  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }

    var _generatorOptions = generatorOptions,
        _generatorOptions$def = _generatorOptions.defaultModifiers,
        defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
        _generatorOptions$def2 = _generatorOptions.defaultOptions,
        defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper(reference, popper, options) {
      if (options === void 0) {
        options = defaultOptions;
      }

      var state = {
        placement: 'bottom',
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
        modifiersData: {},
        elements: {
          reference: reference,
          popper: popper
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state: state,
        setOptions: function setOptions(setOptionsAction) {
          var options = typeof setOptionsAction === 'function' ? setOptionsAction(state.options) : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions, state.options, options);
          state.scrollParents = {
            reference: isElement$1(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
            popper: listScrollParents(popper)
          }; // Orders the modifiers based on their dependencies and `phase`
          // properties

          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

          state.orderedModifiers = orderedModifiers.filter(function (m) {
            return m.enabled;
          }); // Validate the provided modifiers so that the consumer will get warned

          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }

          var _state$elements = state.elements,
              reference = _state$elements.reference,
              popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
          // anymore

          if (!areValidElements(reference, popper)) {

            return;
          } // Store the reference and popper rects to be read by modifiers


          state.rects = {
            reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
            popper: getLayoutRect(popper)
          }; // Modifiers have the ability to reset the current update cycle. The
          // most common use case for this is the `flip` modifier changing the
          // placement, which then needs to re-run all the modifiers, because the
          // logic was previously ran for the previous placement and is therefore
          // stale/incorrect

          state.reset = false;
          state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
          // is filled with the initial data specified by the modifier. This means
          // it doesn't persist and is fresh on each update.
          // To ensure persistent data, use `${name}#persistent`

          state.orderedModifiers.forEach(function (modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });

          for (var index = 0; index < state.orderedModifiers.length; index++) {

            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }

            var _state$orderedModifie = state.orderedModifiers[index],
                fn = _state$orderedModifie.fn,
                _state$orderedModifie2 = _state$orderedModifie.options,
                _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
                name = _state$orderedModifie.name;

            if (typeof fn === 'function') {
              state = fn({
                state: state,
                options: _options,
                name: name,
                instance: instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce$1(function () {
          return new Promise(function (resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };

      if (!areValidElements(reference, popper)) {

        return instance;
      }

      instance.setOptions(options).then(function (state) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state);
        }
      }); // Modifiers have the ability to execute arbitrary code before the first
      // update cycle runs. They will be executed in the same order as the update
      // cycle. This is useful when a modifier adds some persistent data that
      // other modifiers need to use, but the modifier is run after the dependent
      // one.

      function runModifierEffects() {
        state.orderedModifiers.forEach(function (_ref3) {
          var name = _ref3.name,
              _ref3$options = _ref3.options,
              options = _ref3$options === void 0 ? {} : _ref3$options,
              effect = _ref3.effect;

          if (typeof effect === 'function') {
            var cleanupFn = effect({
              state: state,
              name: name,
              instance: instance,
              options: options
            });

            var noopFn = function noopFn() {};

            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }

      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function (fn) {
          return fn();
        });
        effectCleanupFns = [];
      }

      return instance;
    };
  }

  var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
  var createPopper = /*#__PURE__*/popperGenerator({
    defaultModifiers: defaultModifiers
  }); // eslint-disable-next-line import/no-unused-modules

  /**!
  * tippy.js v6.3.7
  * (c) 2017-2021 atomiks
  * MIT License
  */
  var BOX_CLASS = "tippy-box";
  var CONTENT_CLASS = "tippy-content";
  var BACKDROP_CLASS = "tippy-backdrop";
  var ARROW_CLASS = "tippy-arrow";
  var SVG_ARROW_CLASS = "tippy-svg-arrow";
  var TOUCH_OPTIONS = {
    passive: true,
    capture: true
  };
  var TIPPY_DEFAULT_APPEND_TO = function TIPPY_DEFAULT_APPEND_TO() {
    return document.body;
  };
  function getValueAtIndexOrReturn(value, index, defaultValue) {
    if (Array.isArray(value)) {
      var v = value[index];
      return v == null ? Array.isArray(defaultValue) ? defaultValue[index] : defaultValue : v;
    }

    return value;
  }
  function isType(value, type) {
    var str = {}.toString.call(value);
    return str.indexOf('[object') === 0 && str.indexOf(type + "]") > -1;
  }
  function invokeWithArgsOrReturn(value, args) {
    return typeof value === 'function' ? value.apply(void 0, args) : value;
  }
  function debounce(fn, ms) {
    // Avoid wrapping in `setTimeout` if ms is 0 anyway
    if (ms === 0) {
      return fn;
    }

    var timeout;
    return function (arg) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn(arg);
      }, ms);
    };
  }
  function splitBySpaces(value) {
    return value.split(/\s+/).filter(Boolean);
  }
  function normalizeToArray(value) {
    return [].concat(value);
  }
  function pushIfUnique(arr, value) {
    if (arr.indexOf(value) === -1) {
      arr.push(value);
    }
  }
  function unique(arr) {
    return arr.filter(function (item, index) {
      return arr.indexOf(item) === index;
    });
  }
  function getBasePlacement(placement) {
    return placement.split('-')[0];
  }
  function arrayFrom(value) {
    return [].slice.call(value);
  }
  function removeUndefinedProps(obj) {
    return Object.keys(obj).reduce(function (acc, key) {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }

      return acc;
    }, {});
  }

  function div() {
    return document.createElement('div');
  }
  function isElement(value) {
    return ['Element', 'Fragment'].some(function (type) {
      return isType(value, type);
    });
  }
  function isNodeList(value) {
    return isType(value, 'NodeList');
  }
  function isMouseEvent(value) {
    return isType(value, 'MouseEvent');
  }
  function isReferenceElement(value) {
    return !!(value && value._tippy && value._tippy.reference === value);
  }
  function getArrayOfElements(value) {
    if (isElement(value)) {
      return [value];
    }

    if (isNodeList(value)) {
      return arrayFrom(value);
    }

    if (Array.isArray(value)) {
      return value;
    }

    return arrayFrom(document.querySelectorAll(value));
  }
  function setTransitionDuration(els, value) {
    els.forEach(function (el) {
      if (el) {
        el.style.transitionDuration = value + "ms";
      }
    });
  }
  function setVisibilityState(els, state) {
    els.forEach(function (el) {
      if (el) {
        el.setAttribute('data-state', state);
      }
    });
  }
  function getOwnerDocument(elementOrElements) {
    var _element$ownerDocumen;

    var _normalizeToArray = normalizeToArray(elementOrElements),
        element = _normalizeToArray[0]; // Elements created via a <template> have an ownerDocument with no reference to the body


    return element != null && (_element$ownerDocumen = element.ownerDocument) != null && _element$ownerDocumen.body ? element.ownerDocument : document;
  }
  function isCursorOutsideInteractiveBorder(popperTreeData, event) {
    var clientX = event.clientX,
        clientY = event.clientY;
    return popperTreeData.every(function (_ref) {
      var popperRect = _ref.popperRect,
          popperState = _ref.popperState,
          props = _ref.props;
      var interactiveBorder = props.interactiveBorder;
      var basePlacement = getBasePlacement(popperState.placement);
      var offsetData = popperState.modifiersData.offset;

      if (!offsetData) {
        return true;
      }

      var topDistance = basePlacement === 'bottom' ? offsetData.top.y : 0;
      var bottomDistance = basePlacement === 'top' ? offsetData.bottom.y : 0;
      var leftDistance = basePlacement === 'right' ? offsetData.left.x : 0;
      var rightDistance = basePlacement === 'left' ? offsetData.right.x : 0;
      var exceedsTop = popperRect.top - clientY + topDistance > interactiveBorder;
      var exceedsBottom = clientY - popperRect.bottom - bottomDistance > interactiveBorder;
      var exceedsLeft = popperRect.left - clientX + leftDistance > interactiveBorder;
      var exceedsRight = clientX - popperRect.right - rightDistance > interactiveBorder;
      return exceedsTop || exceedsBottom || exceedsLeft || exceedsRight;
    });
  }
  function updateTransitionEndListener(box, action, listener) {
    var method = action + "EventListener"; // some browsers apparently support `transition` (unprefixed) but only fire
    // `webkitTransitionEnd`...

    ['transitionend', 'webkitTransitionEnd'].forEach(function (event) {
      box[method](event, listener);
    });
  }
  /**
   * Compared to xxx.contains, this function works for dom structures with shadow
   * dom
   */

  function actualContains(parent, child) {
    var target = child;

    while (target) {
      var _target$getRootNode;

      if (parent.contains(target)) {
        return true;
      }

      target = target.getRootNode == null ? void 0 : (_target$getRootNode = target.getRootNode()) == null ? void 0 : _target$getRootNode.host;
    }

    return false;
  }

  var currentInput = {
    isTouch: false
  };
  var lastMouseMoveTime = 0;
  /**
   * When a `touchstart` event is fired, it's assumed the user is using touch
   * input. We'll bind a `mousemove` event listener to listen for mouse input in
   * the future. This way, the `isTouch` property is fully dynamic and will handle
   * hybrid devices that use a mix of touch + mouse input.
   */

  function onDocumentTouchStart() {
    if (currentInput.isTouch) {
      return;
    }

    currentInput.isTouch = true;

    if (window.performance) {
      document.addEventListener('mousemove', onDocumentMouseMove);
    }
  }
  /**
   * When two `mousemove` event are fired consecutively within 20ms, it's assumed
   * the user is using mouse input again. `mousemove` can fire on touch devices as
   * well, but very rarely that quickly.
   */

  function onDocumentMouseMove() {
    var now = performance.now();

    if (now - lastMouseMoveTime < 20) {
      currentInput.isTouch = false;
      document.removeEventListener('mousemove', onDocumentMouseMove);
    }

    lastMouseMoveTime = now;
  }
  /**
   * When an element is in focus and has a tippy, leaving the tab/window and
   * returning causes it to show again. For mouse users this is unexpected, but
   * for keyboard use it makes sense.
   * TODO: find a better technique to solve this problem
   */

  function onWindowBlur() {
    var activeElement = document.activeElement;

    if (isReferenceElement(activeElement)) {
      var instance = activeElement._tippy;

      if (activeElement.blur && !instance.state.isVisible) {
        activeElement.blur();
      }
    }
  }
  function bindGlobalEventListeners() {
    document.addEventListener('touchstart', onDocumentTouchStart, TOUCH_OPTIONS);
    window.addEventListener('blur', onWindowBlur);
  }

  var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  var isIE11 = isBrowser ? // @ts-ignore
  !!window.msCrypto : false;

  var pluginProps = {
    animateFill: false,
    followCursor: false,
    inlinePositioning: false,
    sticky: false
  };
  var renderProps = {
    allowHTML: false,
    animation: 'fade',
    arrow: true,
    content: '',
    inertia: false,
    maxWidth: 350,
    role: 'tooltip',
    theme: '',
    zIndex: 9999
  };
  var defaultProps = Object.assign({
    appendTo: TIPPY_DEFAULT_APPEND_TO,
    aria: {
      content: 'auto',
      expanded: 'auto'
    },
    delay: 0,
    duration: [300, 250],
    getReferenceClientRect: null,
    hideOnClick: true,
    ignoreAttributes: false,
    interactive: false,
    interactiveBorder: 2,
    interactiveDebounce: 0,
    moveTransition: '',
    offset: [0, 10],
    onAfterUpdate: function onAfterUpdate() {},
    onBeforeUpdate: function onBeforeUpdate() {},
    onCreate: function onCreate() {},
    onDestroy: function onDestroy() {},
    onHidden: function onHidden() {},
    onHide: function onHide() {},
    onMount: function onMount() {},
    onShow: function onShow() {},
    onShown: function onShown() {},
    onTrigger: function onTrigger() {},
    onUntrigger: function onUntrigger() {},
    onClickOutside: function onClickOutside() {},
    placement: 'top',
    plugins: [],
    popperOptions: {},
    render: null,
    showOnCreate: false,
    touch: true,
    trigger: 'mouseenter focus',
    triggerTarget: null
  }, pluginProps, renderProps);
  var defaultKeys = Object.keys(defaultProps);
  var setDefaultProps = function setDefaultProps(partialProps) {

    var keys = Object.keys(partialProps);
    keys.forEach(function (key) {
      defaultProps[key] = partialProps[key];
    });
  };
  function getExtendedPassedProps(passedProps) {
    var plugins = passedProps.plugins || [];
    var pluginProps = plugins.reduce(function (acc, plugin) {
      var name = plugin.name,
          defaultValue = plugin.defaultValue;

      if (name) {
        var _name;

        acc[name] = passedProps[name] !== undefined ? passedProps[name] : (_name = defaultProps[name]) != null ? _name : defaultValue;
      }

      return acc;
    }, {});
    return Object.assign({}, passedProps, pluginProps);
  }
  function getDataAttributeProps(reference, plugins) {
    var propKeys = plugins ? Object.keys(getExtendedPassedProps(Object.assign({}, defaultProps, {
      plugins: plugins
    }))) : defaultKeys;
    var props = propKeys.reduce(function (acc, key) {
      var valueAsString = (reference.getAttribute("data-tippy-" + key) || '').trim();

      if (!valueAsString) {
        return acc;
      }

      if (key === 'content') {
        acc[key] = valueAsString;
      } else {
        try {
          acc[key] = JSON.parse(valueAsString);
        } catch (e) {
          acc[key] = valueAsString;
        }
      }

      return acc;
    }, {});
    return props;
  }
  function evaluateProps(reference, props) {
    var out = Object.assign({}, props, {
      content: invokeWithArgsOrReturn(props.content, [reference])
    }, props.ignoreAttributes ? {} : getDataAttributeProps(reference, props.plugins));
    out.aria = Object.assign({}, defaultProps.aria, out.aria);
    out.aria = {
      expanded: out.aria.expanded === 'auto' ? props.interactive : out.aria.expanded,
      content: out.aria.content === 'auto' ? props.interactive ? null : 'describedby' : out.aria.content
    };
    return out;
  }

  var innerHTML = function innerHTML() {
    return 'innerHTML';
  };

  function dangerouslySetInnerHTML(element, html) {
    element[innerHTML()] = html;
  }

  function createArrowElement(value) {
    var arrow = div();

    if (value === true) {
      arrow.className = ARROW_CLASS;
    } else {
      arrow.className = SVG_ARROW_CLASS;

      if (isElement(value)) {
        arrow.appendChild(value);
      } else {
        dangerouslySetInnerHTML(arrow, value);
      }
    }

    return arrow;
  }

  function setContent(content, props) {
    if (isElement(props.content)) {
      dangerouslySetInnerHTML(content, '');
      content.appendChild(props.content);
    } else if (typeof props.content !== 'function') {
      if (props.allowHTML) {
        dangerouslySetInnerHTML(content, props.content);
      } else {
        content.textContent = props.content;
      }
    }
  }
  function getChildren(popper) {
    var box = popper.firstElementChild;
    var boxChildren = arrayFrom(box.children);
    return {
      box: box,
      content: boxChildren.find(function (node) {
        return node.classList.contains(CONTENT_CLASS);
      }),
      arrow: boxChildren.find(function (node) {
        return node.classList.contains(ARROW_CLASS) || node.classList.contains(SVG_ARROW_CLASS);
      }),
      backdrop: boxChildren.find(function (node) {
        return node.classList.contains(BACKDROP_CLASS);
      })
    };
  }
  function render(instance) {
    var popper = div();
    var box = div();
    box.className = BOX_CLASS;
    box.setAttribute('data-state', 'hidden');
    box.setAttribute('tabindex', '-1');
    var content = div();
    content.className = CONTENT_CLASS;
    content.setAttribute('data-state', 'hidden');
    setContent(content, instance.props);
    popper.appendChild(box);
    box.appendChild(content);
    onUpdate(instance.props, instance.props);

    function onUpdate(prevProps, nextProps) {
      var _getChildren = getChildren(popper),
          box = _getChildren.box,
          content = _getChildren.content,
          arrow = _getChildren.arrow;

      if (nextProps.theme) {
        box.setAttribute('data-theme', nextProps.theme);
      } else {
        box.removeAttribute('data-theme');
      }

      if (typeof nextProps.animation === 'string') {
        box.setAttribute('data-animation', nextProps.animation);
      } else {
        box.removeAttribute('data-animation');
      }

      if (nextProps.inertia) {
        box.setAttribute('data-inertia', '');
      } else {
        box.removeAttribute('data-inertia');
      }

      box.style.maxWidth = typeof nextProps.maxWidth === 'number' ? nextProps.maxWidth + "px" : nextProps.maxWidth;

      if (nextProps.role) {
        box.setAttribute('role', nextProps.role);
      } else {
        box.removeAttribute('role');
      }

      if (prevProps.content !== nextProps.content || prevProps.allowHTML !== nextProps.allowHTML) {
        setContent(content, instance.props);
      }

      if (nextProps.arrow) {
        if (!arrow) {
          box.appendChild(createArrowElement(nextProps.arrow));
        } else if (prevProps.arrow !== nextProps.arrow) {
          box.removeChild(arrow);
          box.appendChild(createArrowElement(nextProps.arrow));
        }
      } else if (arrow) {
        box.removeChild(arrow);
      }
    }

    return {
      popper: popper,
      onUpdate: onUpdate
    };
  } // Runtime check to identify if the render function is the default one; this
  // way we can apply default CSS transitions logic and it can be tree-shaken away

  render.$$tippy = true;

  var idCounter = 1;
  var mouseMoveListeners = []; // Used by `hideAll()`

  var mountedInstances = [];
  function createTippy(reference, passedProps) {
    var props = evaluateProps(reference, Object.assign({}, defaultProps, getExtendedPassedProps(removeUndefinedProps(passedProps)))); // ===========================================================================
    // 🔒 Private members
    // ===========================================================================

    var showTimeout;
    var hideTimeout;
    var scheduleHideAnimationFrame;
    var isVisibleFromClick = false;
    var didHideDueToDocumentMouseDown = false;
    var didTouchMove = false;
    var ignoreOnFirstUpdate = false;
    var lastTriggerEvent;
    var currentTransitionEndListener;
    var onFirstUpdate;
    var listeners = [];
    var debouncedOnMouseMove = debounce(onMouseMove, props.interactiveDebounce);
    var currentTarget; // ===========================================================================
    // 🔑 Public members
    // ===========================================================================

    var id = idCounter++;
    var popperInstance = null;
    var plugins = unique(props.plugins);
    var state = {
      // Is the instance currently enabled?
      isEnabled: true,
      // Is the tippy currently showing and not transitioning out?
      isVisible: false,
      // Has the instance been destroyed?
      isDestroyed: false,
      // Is the tippy currently mounted to the DOM?
      isMounted: false,
      // Has the tippy finished transitioning in?
      isShown: false
    };
    var instance = {
      // properties
      id: id,
      reference: reference,
      popper: div(),
      popperInstance: popperInstance,
      props: props,
      state: state,
      plugins: plugins,
      // methods
      clearDelayTimeouts: clearDelayTimeouts,
      setProps: setProps,
      setContent: setContent,
      show: show,
      hide: hide,
      hideWithInteractivity: hideWithInteractivity,
      enable: enable,
      disable: disable,
      unmount: unmount,
      destroy: destroy
    }; // TODO: Investigate why this early return causes a TDZ error in the tests —
    // it doesn't seem to happen in the browser

    /* istanbul ignore if */

    if (!props.render) {

      return instance;
    } // ===========================================================================
    // Initial mutations
    // ===========================================================================


    var _props$render = props.render(instance),
        popper = _props$render.popper,
        onUpdate = _props$render.onUpdate;

    popper.setAttribute('data-tippy-root', '');
    popper.id = "tippy-" + instance.id;
    instance.popper = popper;
    reference._tippy = instance;
    popper._tippy = instance;
    var pluginsHooks = plugins.map(function (plugin) {
      return plugin.fn(instance);
    });
    var hasAriaExpanded = reference.hasAttribute('aria-expanded');
    addListeners();
    handleAriaExpandedAttribute();
    handleStyles();
    invokeHook('onCreate', [instance]);

    if (props.showOnCreate) {
      scheduleShow();
    } // Prevent a tippy with a delay from hiding if the cursor left then returned
    // before it started hiding


    popper.addEventListener('mouseenter', function () {
      if (instance.props.interactive && instance.state.isVisible) {
        instance.clearDelayTimeouts();
      }
    });
    popper.addEventListener('mouseleave', function () {
      if (instance.props.interactive && instance.props.trigger.indexOf('mouseenter') >= 0) {
        getDocument().addEventListener('mousemove', debouncedOnMouseMove);
      }
    });
    return instance; // ===========================================================================
    // 🔒 Private methods
    // ===========================================================================

    function getNormalizedTouchSettings() {
      var touch = instance.props.touch;
      return Array.isArray(touch) ? touch : [touch, 0];
    }

    function getIsCustomTouchBehavior() {
      return getNormalizedTouchSettings()[0] === 'hold';
    }

    function getIsDefaultRenderFn() {
      var _instance$props$rende;

      // @ts-ignore
      return !!((_instance$props$rende = instance.props.render) != null && _instance$props$rende.$$tippy);
    }

    function getCurrentTarget() {
      return currentTarget || reference;
    }

    function getDocument() {
      var parent = getCurrentTarget().parentNode;
      return parent ? getOwnerDocument(parent) : document;
    }

    function getDefaultTemplateChildren() {
      return getChildren(popper);
    }

    function getDelay(isShow) {
      // For touch or keyboard input, force `0` delay for UX reasons
      // Also if the instance is mounted but not visible (transitioning out),
      // ignore delay
      if (instance.state.isMounted && !instance.state.isVisible || currentInput.isTouch || lastTriggerEvent && lastTriggerEvent.type === 'focus') {
        return 0;
      }

      return getValueAtIndexOrReturn(instance.props.delay, isShow ? 0 : 1, defaultProps.delay);
    }

    function handleStyles(fromHide) {
      if (fromHide === void 0) {
        fromHide = false;
      }

      popper.style.pointerEvents = instance.props.interactive && !fromHide ? '' : 'none';
      popper.style.zIndex = "" + instance.props.zIndex;
    }

    function invokeHook(hook, args, shouldInvokePropsHook) {
      if (shouldInvokePropsHook === void 0) {
        shouldInvokePropsHook = true;
      }

      pluginsHooks.forEach(function (pluginHooks) {
        if (pluginHooks[hook]) {
          pluginHooks[hook].apply(pluginHooks, args);
        }
      });

      if (shouldInvokePropsHook) {
        var _instance$props;

        (_instance$props = instance.props)[hook].apply(_instance$props, args);
      }
    }

    function handleAriaContentAttribute() {
      var aria = instance.props.aria;

      if (!aria.content) {
        return;
      }

      var attr = "aria-" + aria.content;
      var id = popper.id;
      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        var currentValue = node.getAttribute(attr);

        if (instance.state.isVisible) {
          node.setAttribute(attr, currentValue ? currentValue + " " + id : id);
        } else {
          var nextValue = currentValue && currentValue.replace(id, '').trim();

          if (nextValue) {
            node.setAttribute(attr, nextValue);
          } else {
            node.removeAttribute(attr);
          }
        }
      });
    }

    function handleAriaExpandedAttribute() {
      if (hasAriaExpanded || !instance.props.aria.expanded) {
        return;
      }

      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        if (instance.props.interactive) {
          node.setAttribute('aria-expanded', instance.state.isVisible && node === getCurrentTarget() ? 'true' : 'false');
        } else {
          node.removeAttribute('aria-expanded');
        }
      });
    }

    function cleanupInteractiveMouseListeners() {
      getDocument().removeEventListener('mousemove', debouncedOnMouseMove);
      mouseMoveListeners = mouseMoveListeners.filter(function (listener) {
        return listener !== debouncedOnMouseMove;
      });
    }

    function onDocumentPress(event) {
      // Moved finger to scroll instead of an intentional tap outside
      if (currentInput.isTouch) {
        if (didTouchMove || event.type === 'mousedown') {
          return;
        }
      }

      var actualTarget = event.composedPath && event.composedPath()[0] || event.target; // Clicked on interactive popper

      if (instance.props.interactive && actualContains(popper, actualTarget)) {
        return;
      } // Clicked on the event listeners target


      if (normalizeToArray(instance.props.triggerTarget || reference).some(function (el) {
        return actualContains(el, actualTarget);
      })) {
        if (currentInput.isTouch) {
          return;
        }

        if (instance.state.isVisible && instance.props.trigger.indexOf('click') >= 0) {
          return;
        }
      } else {
        invokeHook('onClickOutside', [instance, event]);
      }

      if (instance.props.hideOnClick === true) {
        instance.clearDelayTimeouts();
        instance.hide(); // `mousedown` event is fired right before `focus` if pressing the
        // currentTarget. This lets a tippy with `focus` trigger know that it
        // should not show

        didHideDueToDocumentMouseDown = true;
        setTimeout(function () {
          didHideDueToDocumentMouseDown = false;
        }); // The listener gets added in `scheduleShow()`, but this may be hiding it
        // before it shows, and hide()'s early bail-out behavior can prevent it
        // from being cleaned up

        if (!instance.state.isMounted) {
          removeDocumentPress();
        }
      }
    }

    function onTouchMove() {
      didTouchMove = true;
    }

    function onTouchStart() {
      didTouchMove = false;
    }

    function addDocumentPress() {
      var doc = getDocument();
      doc.addEventListener('mousedown', onDocumentPress, true);
      doc.addEventListener('touchend', onDocumentPress, TOUCH_OPTIONS);
      doc.addEventListener('touchstart', onTouchStart, TOUCH_OPTIONS);
      doc.addEventListener('touchmove', onTouchMove, TOUCH_OPTIONS);
    }

    function removeDocumentPress() {
      var doc = getDocument();
      doc.removeEventListener('mousedown', onDocumentPress, true);
      doc.removeEventListener('touchend', onDocumentPress, TOUCH_OPTIONS);
      doc.removeEventListener('touchstart', onTouchStart, TOUCH_OPTIONS);
      doc.removeEventListener('touchmove', onTouchMove, TOUCH_OPTIONS);
    }

    function onTransitionedOut(duration, callback) {
      onTransitionEnd(duration, function () {
        if (!instance.state.isVisible && popper.parentNode && popper.parentNode.contains(popper)) {
          callback();
        }
      });
    }

    function onTransitionedIn(duration, callback) {
      onTransitionEnd(duration, callback);
    }

    function onTransitionEnd(duration, callback) {
      var box = getDefaultTemplateChildren().box;

      function listener(event) {
        if (event.target === box) {
          updateTransitionEndListener(box, 'remove', listener);
          callback();
        }
      } // Make callback synchronous if duration is 0
      // `transitionend` won't fire otherwise


      if (duration === 0) {
        return callback();
      }

      updateTransitionEndListener(box, 'remove', currentTransitionEndListener);
      updateTransitionEndListener(box, 'add', listener);
      currentTransitionEndListener = listener;
    }

    function on(eventType, handler, options) {
      if (options === void 0) {
        options = false;
      }

      var nodes = normalizeToArray(instance.props.triggerTarget || reference);
      nodes.forEach(function (node) {
        node.addEventListener(eventType, handler, options);
        listeners.push({
          node: node,
          eventType: eventType,
          handler: handler,
          options: options
        });
      });
    }

    function addListeners() {
      if (getIsCustomTouchBehavior()) {
        on('touchstart', onTrigger, {
          passive: true
        });
        on('touchend', onMouseLeave, {
          passive: true
        });
      }

      splitBySpaces(instance.props.trigger).forEach(function (eventType) {
        if (eventType === 'manual') {
          return;
        }

        on(eventType, onTrigger);

        switch (eventType) {
          case 'mouseenter':
            on('mouseleave', onMouseLeave);
            break;

          case 'focus':
            on(isIE11 ? 'focusout' : 'blur', onBlurOrFocusOut);
            break;

          case 'focusin':
            on('focusout', onBlurOrFocusOut);
            break;
        }
      });
    }

    function removeListeners() {
      listeners.forEach(function (_ref) {
        var node = _ref.node,
            eventType = _ref.eventType,
            handler = _ref.handler,
            options = _ref.options;
        node.removeEventListener(eventType, handler, options);
      });
      listeners = [];
    }

    function onTrigger(event) {
      var _lastTriggerEvent;

      var shouldScheduleClickHide = false;

      if (!instance.state.isEnabled || isEventListenerStopped(event) || didHideDueToDocumentMouseDown) {
        return;
      }

      var wasFocused = ((_lastTriggerEvent = lastTriggerEvent) == null ? void 0 : _lastTriggerEvent.type) === 'focus';
      lastTriggerEvent = event;
      currentTarget = event.currentTarget;
      handleAriaExpandedAttribute();

      if (!instance.state.isVisible && isMouseEvent(event)) {
        // If scrolling, `mouseenter` events can be fired if the cursor lands
        // over a new target, but `mousemove` events don't get fired. This
        // causes interactive tooltips to get stuck open until the cursor is
        // moved
        mouseMoveListeners.forEach(function (listener) {
          return listener(event);
        });
      } // Toggle show/hide when clicking click-triggered tooltips


      if (event.type === 'click' && (instance.props.trigger.indexOf('mouseenter') < 0 || isVisibleFromClick) && instance.props.hideOnClick !== false && instance.state.isVisible) {
        shouldScheduleClickHide = true;
      } else {
        scheduleShow(event);
      }

      if (event.type === 'click') {
        isVisibleFromClick = !shouldScheduleClickHide;
      }

      if (shouldScheduleClickHide && !wasFocused) {
        scheduleHide(event);
      }
    }

    function onMouseMove(event) {
      var target = event.target;
      var isCursorOverReferenceOrPopper = getCurrentTarget().contains(target) || popper.contains(target);

      if (event.type === 'mousemove' && isCursorOverReferenceOrPopper) {
        return;
      }

      var popperTreeData = getNestedPopperTree().concat(popper).map(function (popper) {
        var _instance$popperInsta;

        var instance = popper._tippy;
        var state = (_instance$popperInsta = instance.popperInstance) == null ? void 0 : _instance$popperInsta.state;

        if (state) {
          return {
            popperRect: popper.getBoundingClientRect(),
            popperState: state,
            props: props
          };
        }

        return null;
      }).filter(Boolean);

      if (isCursorOutsideInteractiveBorder(popperTreeData, event)) {
        cleanupInteractiveMouseListeners();
        scheduleHide(event);
      }
    }

    function onMouseLeave(event) {
      var shouldBail = isEventListenerStopped(event) || instance.props.trigger.indexOf('click') >= 0 && isVisibleFromClick;

      if (shouldBail) {
        return;
      }

      if (instance.props.interactive) {
        instance.hideWithInteractivity(event);
        return;
      }

      scheduleHide(event);
    }

    function onBlurOrFocusOut(event) {
      if (instance.props.trigger.indexOf('focusin') < 0 && event.target !== getCurrentTarget()) {
        return;
      } // If focus was moved to within the popper


      if (instance.props.interactive && event.relatedTarget && popper.contains(event.relatedTarget)) {
        return;
      }

      scheduleHide(event);
    }

    function isEventListenerStopped(event) {
      return currentInput.isTouch ? getIsCustomTouchBehavior() !== event.type.indexOf('touch') >= 0 : false;
    }

    function createPopperInstance() {
      destroyPopperInstance();
      var _instance$props2 = instance.props,
          popperOptions = _instance$props2.popperOptions,
          placement = _instance$props2.placement,
          offset = _instance$props2.offset,
          getReferenceClientRect = _instance$props2.getReferenceClientRect,
          moveTransition = _instance$props2.moveTransition;
      var arrow = getIsDefaultRenderFn() ? getChildren(popper).arrow : null;
      var computedReference = getReferenceClientRect ? {
        getBoundingClientRect: getReferenceClientRect,
        contextElement: getReferenceClientRect.contextElement || getCurrentTarget()
      } : reference;
      var tippyModifier = {
        name: '$$tippy',
        enabled: true,
        phase: 'beforeWrite',
        requires: ['computeStyles'],
        fn: function fn(_ref2) {
          var state = _ref2.state;

          if (getIsDefaultRenderFn()) {
            var _getDefaultTemplateCh = getDefaultTemplateChildren(),
                box = _getDefaultTemplateCh.box;

            ['placement', 'reference-hidden', 'escaped'].forEach(function (attr) {
              if (attr === 'placement') {
                box.setAttribute('data-placement', state.placement);
              } else {
                if (state.attributes.popper["data-popper-" + attr]) {
                  box.setAttribute("data-" + attr, '');
                } else {
                  box.removeAttribute("data-" + attr);
                }
              }
            });
            state.attributes.popper = {};
          }
        }
      };
      var modifiers = [{
        name: 'offset',
        options: {
          offset: offset
        }
      }, {
        name: 'preventOverflow',
        options: {
          padding: {
            top: 2,
            bottom: 2,
            left: 5,
            right: 5
          }
        }
      }, {
        name: 'flip',
        options: {
          padding: 5
        }
      }, {
        name: 'computeStyles',
        options: {
          adaptive: !moveTransition
        }
      }, tippyModifier];

      if (getIsDefaultRenderFn() && arrow) {
        modifiers.push({
          name: 'arrow',
          options: {
            element: arrow,
            padding: 3
          }
        });
      }

      modifiers.push.apply(modifiers, (popperOptions == null ? void 0 : popperOptions.modifiers) || []);
      instance.popperInstance = createPopper(computedReference, popper, Object.assign({}, popperOptions, {
        placement: placement,
        onFirstUpdate: onFirstUpdate,
        modifiers: modifiers
      }));
    }

    function destroyPopperInstance() {
      if (instance.popperInstance) {
        instance.popperInstance.destroy();
        instance.popperInstance = null;
      }
    }

    function mount() {
      var appendTo = instance.props.appendTo;
      var parentNode; // By default, we'll append the popper to the triggerTargets's parentNode so
      // it's directly after the reference element so the elements inside the
      // tippy can be tabbed to
      // If there are clipping issues, the user can specify a different appendTo
      // and ensure focus management is handled correctly manually

      var node = getCurrentTarget();

      if (instance.props.interactive && appendTo === TIPPY_DEFAULT_APPEND_TO || appendTo === 'parent') {
        parentNode = node.parentNode;
      } else {
        parentNode = invokeWithArgsOrReturn(appendTo, [node]);
      } // The popper element needs to exist on the DOM before its position can be
      // updated as Popper needs to read its dimensions


      if (!parentNode.contains(popper)) {
        parentNode.appendChild(popper);
      }

      instance.state.isMounted = true;
      createPopperInstance();
    }

    function getNestedPopperTree() {
      return arrayFrom(popper.querySelectorAll('[data-tippy-root]'));
    }

    function scheduleShow(event) {
      instance.clearDelayTimeouts();

      if (event) {
        invokeHook('onTrigger', [instance, event]);
      }

      addDocumentPress();
      var delay = getDelay(true);

      var _getNormalizedTouchSe = getNormalizedTouchSettings(),
          touchValue = _getNormalizedTouchSe[0],
          touchDelay = _getNormalizedTouchSe[1];

      if (currentInput.isTouch && touchValue === 'hold' && touchDelay) {
        delay = touchDelay;
      }

      if (delay) {
        showTimeout = setTimeout(function () {
          instance.show();
        }, delay);
      } else {
        instance.show();
      }
    }

    function scheduleHide(event) {
      instance.clearDelayTimeouts();
      invokeHook('onUntrigger', [instance, event]);

      if (!instance.state.isVisible) {
        removeDocumentPress();
        return;
      } // For interactive tippies, scheduleHide is added to a document.body handler
      // from onMouseLeave so must intercept scheduled hides from mousemove/leave
      // events when trigger contains mouseenter and click, and the tip is
      // currently shown as a result of a click.


      if (instance.props.trigger.indexOf('mouseenter') >= 0 && instance.props.trigger.indexOf('click') >= 0 && ['mouseleave', 'mousemove'].indexOf(event.type) >= 0 && isVisibleFromClick) {
        return;
      }

      var delay = getDelay(false);

      if (delay) {
        hideTimeout = setTimeout(function () {
          if (instance.state.isVisible) {
            instance.hide();
          }
        }, delay);
      } else {
        // Fixes a `transitionend` problem when it fires 1 frame too
        // late sometimes, we don't want hide() to be called.
        scheduleHideAnimationFrame = requestAnimationFrame(function () {
          instance.hide();
        });
      }
    } // ===========================================================================
    // 🔑 Public methods
    // ===========================================================================


    function enable() {
      instance.state.isEnabled = true;
    }

    function disable() {
      // Disabling the instance should also hide it
      // https://github.com/atomiks/tippy.js-react/issues/106
      instance.hide();
      instance.state.isEnabled = false;
    }

    function clearDelayTimeouts() {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      cancelAnimationFrame(scheduleHideAnimationFrame);
    }

    function setProps(partialProps) {

      if (instance.state.isDestroyed) {
        return;
      }

      invokeHook('onBeforeUpdate', [instance, partialProps]);
      removeListeners();
      var prevProps = instance.props;
      var nextProps = evaluateProps(reference, Object.assign({}, prevProps, removeUndefinedProps(partialProps), {
        ignoreAttributes: true
      }));
      instance.props = nextProps;
      addListeners();

      if (prevProps.interactiveDebounce !== nextProps.interactiveDebounce) {
        cleanupInteractiveMouseListeners();
        debouncedOnMouseMove = debounce(onMouseMove, nextProps.interactiveDebounce);
      } // Ensure stale aria-expanded attributes are removed


      if (prevProps.triggerTarget && !nextProps.triggerTarget) {
        normalizeToArray(prevProps.triggerTarget).forEach(function (node) {
          node.removeAttribute('aria-expanded');
        });
      } else if (nextProps.triggerTarget) {
        reference.removeAttribute('aria-expanded');
      }

      handleAriaExpandedAttribute();
      handleStyles();

      if (onUpdate) {
        onUpdate(prevProps, nextProps);
      }

      if (instance.popperInstance) {
        createPopperInstance(); // Fixes an issue with nested tippies if they are all getting re-rendered,
        // and the nested ones get re-rendered first.
        // https://github.com/atomiks/tippyjs-react/issues/177
        // TODO: find a cleaner / more efficient solution(!)

        getNestedPopperTree().forEach(function (nestedPopper) {
          // React (and other UI libs likely) requires a rAF wrapper as it flushes
          // its work in one
          requestAnimationFrame(nestedPopper._tippy.popperInstance.forceUpdate);
        });
      }

      invokeHook('onAfterUpdate', [instance, partialProps]);
    }

    function setContent(content) {
      instance.setProps({
        content: content
      });
    }

    function show() {


      var isAlreadyVisible = instance.state.isVisible;
      var isDestroyed = instance.state.isDestroyed;
      var isDisabled = !instance.state.isEnabled;
      var isTouchAndTouchDisabled = currentInput.isTouch && !instance.props.touch;
      var duration = getValueAtIndexOrReturn(instance.props.duration, 0, defaultProps.duration);

      if (isAlreadyVisible || isDestroyed || isDisabled || isTouchAndTouchDisabled) {
        return;
      } // Normalize `disabled` behavior across browsers.
      // Firefox allows events on disabled elements, but Chrome doesn't.
      // Using a wrapper element (i.e. <span>) is recommended.


      if (getCurrentTarget().hasAttribute('disabled')) {
        return;
      }

      invokeHook('onShow', [instance], false);

      if (instance.props.onShow(instance) === false) {
        return;
      }

      instance.state.isVisible = true;

      if (getIsDefaultRenderFn()) {
        popper.style.visibility = 'visible';
      }

      handleStyles();
      addDocumentPress();

      if (!instance.state.isMounted) {
        popper.style.transition = 'none';
      } // If flipping to the opposite side after hiding at least once, the
      // animation will use the wrong placement without resetting the duration


      if (getIsDefaultRenderFn()) {
        var _getDefaultTemplateCh2 = getDefaultTemplateChildren(),
            box = _getDefaultTemplateCh2.box,
            content = _getDefaultTemplateCh2.content;

        setTransitionDuration([box, content], 0);
      }

      onFirstUpdate = function onFirstUpdate() {
        var _instance$popperInsta2;

        if (!instance.state.isVisible || ignoreOnFirstUpdate) {
          return;
        }

        ignoreOnFirstUpdate = true; // reflow

        void popper.offsetHeight;
        popper.style.transition = instance.props.moveTransition;

        if (getIsDefaultRenderFn() && instance.props.animation) {
          var _getDefaultTemplateCh3 = getDefaultTemplateChildren(),
              _box = _getDefaultTemplateCh3.box,
              _content = _getDefaultTemplateCh3.content;

          setTransitionDuration([_box, _content], duration);
          setVisibilityState([_box, _content], 'visible');
        }

        handleAriaContentAttribute();
        handleAriaExpandedAttribute();
        pushIfUnique(mountedInstances, instance); // certain modifiers (e.g. `maxSize`) require a second update after the
        // popper has been positioned for the first time

        (_instance$popperInsta2 = instance.popperInstance) == null ? void 0 : _instance$popperInsta2.forceUpdate();
        invokeHook('onMount', [instance]);

        if (instance.props.animation && getIsDefaultRenderFn()) {
          onTransitionedIn(duration, function () {
            instance.state.isShown = true;
            invokeHook('onShown', [instance]);
          });
        }
      };

      mount();
    }

    function hide() {


      var isAlreadyHidden = !instance.state.isVisible;
      var isDestroyed = instance.state.isDestroyed;
      var isDisabled = !instance.state.isEnabled;
      var duration = getValueAtIndexOrReturn(instance.props.duration, 1, defaultProps.duration);

      if (isAlreadyHidden || isDestroyed || isDisabled) {
        return;
      }

      invokeHook('onHide', [instance], false);

      if (instance.props.onHide(instance) === false) {
        return;
      }

      instance.state.isVisible = false;
      instance.state.isShown = false;
      ignoreOnFirstUpdate = false;
      isVisibleFromClick = false;

      if (getIsDefaultRenderFn()) {
        popper.style.visibility = 'hidden';
      }

      cleanupInteractiveMouseListeners();
      removeDocumentPress();
      handleStyles(true);

      if (getIsDefaultRenderFn()) {
        var _getDefaultTemplateCh4 = getDefaultTemplateChildren(),
            box = _getDefaultTemplateCh4.box,
            content = _getDefaultTemplateCh4.content;

        if (instance.props.animation) {
          setTransitionDuration([box, content], duration);
          setVisibilityState([box, content], 'hidden');
        }
      }

      handleAriaContentAttribute();
      handleAriaExpandedAttribute();

      if (instance.props.animation) {
        if (getIsDefaultRenderFn()) {
          onTransitionedOut(duration, instance.unmount);
        }
      } else {
        instance.unmount();
      }
    }

    function hideWithInteractivity(event) {

      getDocument().addEventListener('mousemove', debouncedOnMouseMove);
      pushIfUnique(mouseMoveListeners, debouncedOnMouseMove);
      debouncedOnMouseMove(event);
    }

    function unmount() {

      if (instance.state.isVisible) {
        instance.hide();
      }

      if (!instance.state.isMounted) {
        return;
      }

      destroyPopperInstance(); // If a popper is not interactive, it will be appended outside the popper
      // tree by default. This seems mainly for interactive tippies, but we should
      // find a workaround if possible

      getNestedPopperTree().forEach(function (nestedPopper) {
        nestedPopper._tippy.unmount();
      });

      if (popper.parentNode) {
        popper.parentNode.removeChild(popper);
      }

      mountedInstances = mountedInstances.filter(function (i) {
        return i !== instance;
      });
      instance.state.isMounted = false;
      invokeHook('onHidden', [instance]);
    }

    function destroy() {

      if (instance.state.isDestroyed) {
        return;
      }

      instance.clearDelayTimeouts();
      instance.unmount();
      removeListeners();
      delete reference._tippy;
      instance.state.isDestroyed = true;
      invokeHook('onDestroy', [instance]);
    }
  }

  function tippy(targets, optionalProps) {
    if (optionalProps === void 0) {
      optionalProps = {};
    }

    var plugins = defaultProps.plugins.concat(optionalProps.plugins || []);

    bindGlobalEventListeners();
    var passedProps = Object.assign({}, optionalProps, {
      plugins: plugins
    });
    var elements = getArrayOfElements(targets);

    var instances = elements.reduce(function (acc, reference) {
      var instance = reference && createTippy(reference, passedProps);

      if (instance) {
        acc.push(instance);
      }

      return acc;
    }, []);
    return isElement(targets) ? instances[0] : instances;
  }

  tippy.defaultProps = defaultProps;
  tippy.setDefaultProps = setDefaultProps;
  tippy.currentInput = currentInput;

  // every time the popper is destroyed (i.e. a new target), removing the styles
  // and causing transitions to break for singletons when the console is open, but
  // most notably for non-transform styles being used, `gpuAcceleration: false`.

  Object.assign({}, applyStyles$1, {
    effect: function effect(_ref) {
      var state = _ref.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: '0',
          top: '0',
          margin: '0'
        },
        arrow: {
          position: 'absolute'
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;

      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      } // intentionally return no cleanup function
      // return () => { ... }

    }
  });

  tippy.setDefaultProps({
    render: render
  });

  let option = {
  	checkRoot: "body",
  	containerIgnore: ".sa11y-ignore",
  	contrastIgnore: ".sr-only",
  	outlineIgnore: "",
  	headerIgnore: "",
  	imageIgnore: "",
  	linkIgnore: 'nav *, [role="navigation"] *',
  	linkIgnoreSpan: "",
  	linksToFlag: "",
  	nonConsecutiveHeadingIsError: true,
  	flagLongHeadings: true,
  	showGoodLinkButton: true,
  	detectSPArouting: false,
  	doNotRun: "",

  	// Readability
  	readabilityPlugin: true,
  	readabilityRoot: "body",
  	readabilityLang: "en",
  	readabilityIgnore: "",

  	// Other plugins
  	contrastPlugin: true,
  	formLabelsPlugin: true,
  	linksAdvancedPlugin: true,
  	customChecks: true,

  	// QA rulesets
  	badLinksQA: true,
  	strongItalicsQA: true,
  	pdfQA: true,
  	langQA: true,
  	blockquotesQA: true,
  	tablesQA: true,
  	allCapsQA: true,
  	fakeHeadingsQA: true,
  	fakeListQA: true,
  	duplicateIdQA: true,
  	underlinedTextQA: true,
  	pageTitleQA: true,

  	// Embedded content rulesets
  	embeddedContentAll: true,
  	embeddedContentAudio: true,
  	embeddedContentVideo: true,
  	embeddedContentTwitter: true,
  	embeddedContentDataViz: true,
  	embeddedContentTitles: true,
  	embeddedContentGeneral: true,

  	// Embedded content
  	videoContent: "youtube.com, vimeo.com, yuja.com, panopto.com",
  	audioContent:
  		"soundcloud.com, simplecast.com, podbean.com, buzzsprout.com, blubrry.com, transistor.fm, fusebox.fm, libsyn.com",
  	dataVizContent: "datastudio.google.com, tableau",
  	twitterContent: "twitter-timeline",
  	embeddedContent: `youtube.com, vimeo.com, yuja.com, panopto.com, soundcloud.com, simplecast.com, podbean.com, buzzsprout.com, blubrry.com, transistor.fm, fusebox.fm, libsyn.com, datastudio.google.com, tableau,twitter-timeline`,
  };

  var en = {
  	// English
  	strings: {
  	  LANG_CODE: 'en',
  	  MAIN_TOGGLE_LABEL: 'Check Accessibility',
  	  CONTAINER_LABEL: 'Accessibility Checker',
  	  ERROR: 'Error',
  	  ERRORS: 'Errors',
  	  WARNING: 'Warning',
  	  WARNINGS: 'Warnings',
  	  GOOD: 'Good',
  	  ON: 'On',
  	  OFF: 'Off',
  	  ALERT_TEXT: 'Alert',
  	  ALERT_CLOSE: 'Close',
  	  SHOW_OUTLINE: 'Show Outline',
  	  HIDE_OUTLINE: 'Hide Outline',
  	  SHOW_SETTINGS: 'Show Settings',
  	  HIDE_SETTINGS: 'Hide Settings',
  	  PAGE_OUTLINE: 'Page outline',
  	  SETTINGS: 'Settings',
  	  CONTRAST: 'Contrast',
  	  FORM_LABELS: 'Form labels',
  	  LINKS_ADVANCED: 'Links (Advanced)',
  	  DARK_MODE: 'Dark mode',
  	  SHORTCUT_SCREEN_READER: 'Skip to issue. Keyboard shortcut: Alt period',
  	  SHORTCUT_TOOLTIP: 'Skip to issue',
  	  NEW_TAB: 'Opens new tab',
  	  PANEL_HEADING: 'Accessibility check',
  	  PANEL_STATUS_NONE: 'No errors found.',
  	  PANEL_ICON_WARNINGS: 'warnings found.',
  	  PANEL_ICON_TOTAL: 'total issues found.',
  	  NOT_VISIBLE_ALERT: 'The item you are trying to view is not visible; it may be hidden or inside of an accordion or tab component. Here is a preview:',
  	  ERROR_MISSING_ROOT_TARGET: 'The full page was checked for accessibility because the target area <code>%(root)</code> does not exist.',
    
  	  // Alternative text module stop words
  	  SUSPICIOUS_ALT_STOPWORDS: ['image', 'graphic', 'picture', 'photo'],
  	  PLACEHOLDER_ALT_STOPWORDS: ['alt', 'image', 'photo', 'decorative', 'photo', 'placeholder', 'placeholder image', 'spacer', '.'],
  	  PARTIAL_ALT_STOPWORDS: [
  		'click',
  		'click here',
  		'click here for more',
  		'click here to learn more',
  		'click here to learn more.',
  		'check out',
  		'download',
  		'download here',
  		'download here.',
  		'find out',
  		'find out more',
  		'find out more.',
  		'find out more >',
  		'form',
  		'here',
  		'here.',
  		'info',
  		'information',
  		'link',
  		'learn',
  		'learn more',
  		'learn more.',
  		'learn more >',
  		'learn to',
  		'more',
  		'more >',
  		'page',
  		'paper',
  		'read more',
  		'read more >',
  		'read',
  		'read this',
  		'this',
  		'this page',
  		'this page.',
  		'this website',
  		'this website.',
  		'view',
  		'view our',
  		'website',
  		'.',
  	  ],
  	  WARNING_ALT_STOPWORDS: ['< ', ' >', 'click here'],
  	  NEW_WINDOW_PHRASES: ['external', 'new tab', 'new window', 'pop-up', 'pop up'],
    
  	  // Only some items in list would need to be translated.
  	  FILE_TYPE_PHRASES: ['document', 'spreadsheet', 'worksheet', 'install', 'video', 'pdf', 'doc',
  		'docx', 'word', 'mp3', 'ppt', 'text', 'pptx', 'powerpoint', 'txt', 'exe', 'dmg', 'rtf', 'windows', 'macos', 'csv', 'xls', 'xlsx', 'mp4', 'mov', 'avi', 'zip'],
    
  	  // Readability
  	  LANG_READABILITY: 'Readability',
  	  LANG_AVG_SENTENCE: 'Average words per sentence:',
  	  LANG_COMPLEX_WORDS: 'Complex words:',
  	  LANG_TOTAL_WORDS: 'Words:',
  	  LANG_VERY_DIFFICULT: 'Very difficult',
  	  LANG_DIFFICULT: 'Difficult',
  	  LANG_FAIRLY_DIFFICULT: 'Fairly difficult',
  	  LANG_GOOD: 'Good',
  	  READABILITY_NO_P_OR_LI_MESSAGE: 'Unable to calculate readability score. No paragraph <code>&lt;p&gt;</code> or list content <code>&lt;li&gt;</code> found.',
  	  READABILITY_NOT_ENOUGH_CONTENT_MESSAGE: 'Not enough content to calculate readability score.',
    
  	  // Headings
  	  HEADING_NON_CONSECUTIVE_LEVEL: 'Non-consecutive heading level used. Headings should never skip levels, or go from <strong>Heading %(prevLevel)</strong> to <strong {r}>Heading %(level)</strong>.',
  	  HEADING_EMPTY: 'Empty heading found! To fix, delete this line or change its format from <strong {r}>Heading %(level)</strong> to <strong>Normal</strong> or <strong>Paragraph</strong>.',
  	  HEADING_LONG: 'Heading is long! Headings should be used to organize content and convey structure. They should be brief, informative, and unique. Please keep headings less than 160 characters (no more than a sentence). <hr> Character count: <strong {r}>%(headingLength)</strong>',
  	  HEADING_FIRST: 'The first heading on a page should usually be a Heading 1 or Heading 2. Heading 1 should be the start of the main content section, and is the main heading that describes the overall purpose of the page. Learn more about <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">Heading Structure.</a>',
  	  HEADING_MISSING_ONE: 'Missing Heading 1. Heading 1 should be the start of the main content area, and is the main heading that describes the overall purpose of the page. Learn more about <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">Heading Structure.</a>',
  	  HEADING_EMPTY_WITH_IMAGE: 'Heading has no text, but contains an image. If this is not a heading, change its format from <strong {r}>Heading %(level)</strong> to <strong>Normal</strong> or <strong>Paragraph</strong>. Otherwise, please add alt text to the image if it is not decorative.',
  	  PANEL_HEADING_MISSING_ONE: 'Missing Heading 1!',
    
  	  // Links
  	  LINK_EMPTY: 'Remove empty links without any text.',
  	  LINK_EMPTY_LINK_NO_LABEL: 'Link does not have discernable text that is visible to screen readers and other assistive technology. To fix: <ul><li>Add some concise text that describes where the link takes you.</li><li>If it is an <a href="https://a11y-101.com/development/icons-and-links">icon link or SVG,</a> it is likely missing a descriptive label.</li><li>If you think this link is an error due to a copy/paste bug, consider deleting it.</li></ul>',
  	  LINK_LABEL: '<strong>Link label:</strong> %(linkText)',
  	  LINK_STOPWORD: 'Link text may not be descriptive enough out of context: <strong {r}>%(error)</strong><hr><strong>Tip!</strong> Link text should always be clear, unique, and meaningful. Avoid common words like &quot;click here&quot; or &quot;learn more&quot;',
  	  LINK_BEST_PRACTICES: 'Consider replacing the link text: <strong {r}>%(error)</strong><hr><ul><li>&quot;Click here&quot; places focus on mouse mechanics, when many people do not use a mouse or may be viewing this website on a mobile device. Consider using a different verb that relates to the task.</li><li>Avoid using HTML symbols as call to actions unless they are hidden to assistive technologies.</li></ul>',
  	  LINK_URL: 'Longer, less intelligible URLs used as link text might be difficult to listen to with assistive technology. In most cases, it is better to use human-readable text instead of the URL. Short URLs (such as a site\'s homepage) are okay.<hr><strong>Tip!</strong> Link text should always be clear, unique, and meaningful so it could be understood out of context.',
    
  	  // Links advanced
  	  NEW_TAB_WARNING: 'Link opens in a new tab or window without warning. Doing so can be disorienting, especially for people who have difficulty perceiving visual content. Secondly, it is not always a good practice to control someone\'s experience or make decisions for them. Indicate that the link opens in a new window within the link text<hr><strong>Tip!</strong> Learn best practices: <a href="https://www.nngroup.com/articles/new-browser-windows-and-tabs/">opening links in new browser windows and tabs.</a>',
  	  FILE_TYPE_WARNING: 'Link points to a PDF or downloadable file (e.g. MP3, Zip, Word Doc) without warning. Indicate the file type within the link text. If it is a large file, consider including the file size.<hr><strong>Example:</strong> Executive Report (PDF, 3MB)',
  	  LINK_IDENTICAL_NAME: 'Link has identical text as another link, although it points to a different page. Multiple links with the same text may cause confusion for people who use screen readers.<hr>Consider making the following link more descriptive to help distinguish it from other links: <strong {r}>%(linkText)</strong>',
    
  	  // Images
  	  MISSING_ALT_LINK_BUT_HAS_TEXT_MESSAGE: 'Image is being used as a link with surrounding text, although the alt attribute should be marked as decorative or null.',
  	  MISSING_ALT_LINK_MESSAGE: 'Image is being used as a link but is missing alt text! Please ensure alt text describes where the link takes you.',
  	  MISSING_ALT_MESSAGE: 'Missing alt text! If the image conveys a story, mood, or important information - be sure to describe the image.',
  	  LINK_IMAGE_BAD_ALT_MESSAGE: 'File extension within the alt text found. Ensure the alt text describes the destination of the link, not a literal description of the image. Remove: <strong {r}>%(error)</strong>.<hr><strong>Alt text:</strong> %(altText)',
  	  LINK_IMAGE_PLACEHOLDER_ALT_MESSAGE: 'Non-descript or placeholder alt text within a linked image found. Ensure the alt text describes the destination of the link, not a literal description of the image. Replace the following alt text: <strong {r}>%(altText)</strong>',
  	  LINK_IMAGE_SUS_ALT_MESSAGE: 'Assistive technologies already indicate that this is an image, so &quot;<strong {r}>%(error)</strong>&quot; may be redundant. Ensure the alt text describes the destination of the link, not a literal description of the image. <hr> <strong>Alt text:</strong> %(altText)',
  	  LINK_ALT_HAS_BAD_WORD_MESSAGE: 'File extension within the alt text found. If the image conveys a story, mood, or important information - be sure to describe the image. Remove: <strong {r}>%(error)</strong>.<hr><strong>Alt text:</strong> %(altText)',
  	  ALT_PLACEHOLDER_MESSAGE: 'Non-descript or placeholder alt text found. Replace the following alt text with something more meaningful: <strong {r}>%(altText)</strong>',
  	  ALT_HAS_SUS_WORD: 'Assistive technologies already indicate that this is an image, so &quot;<strong {r}>%(error)</strong>&quot; may be redundant. <hr> <strong>Alt text:</strong> %(altText)',
  	  LINK_IMAGE_ARIA_HIDDEN: 'Link around image has <code>aria-hidden=&quot;true&quot;</code> but is still keyboard focusable. If you are intending to hide a redundant or duplicate link, add <code>tabindex=&quot;-1&quot;</code> as well.',
  	  LINK_IMAGE_NO_ALT_TEXT: 'Image within link is marked as decorative and there is no link text. Please add alt text to the image that describes the destination of the link.',
  	  LINK_IMAGE_HAS_TEXT: 'Image is marked as decorative, although the link is using the surrounding text as a descriptive label.',
  	  LINK_IMAGE_LONG_ALT: 'Poop',
  	  LINK_IMAGE_ALT_WARNING: 'Image link contains alt text, although please ensure alt text describes the destination page. <strong>Consider using the title of the page it links to as the alt text.</strong> Does the alt text describe where the link takes you? <hr> <strong>Alt text:</strong> %(altText)',
  	  LINK_IMAGE_ALT_AND_TEXT_WARNING: 'Image link contains <strong>both alt text and surrounding link text.</strong> If this image is decorative and is being used as a functional link to another page, consider marking the image as decorative or null - the surrounding link text should suffice. <hr> <strong>Alt text:</strong> %(altText)',
  	  IMAGE_FIGURE_DECORATIVE: 'Image is marked as <strong>decorative</strong> and will be ignored by assistive technology. <hr> Although a <strong>caption</strong> was provided, the image should also have alt text in most cases. <ul> <li>The alt text should provide a concise description of what is in the image.</li><li>The caption should usually provide context to relate the image back to the surrounding content, or give attention to a particular piece of information.</li></ul>',
  	  IMAGE_FIGURE_DUPLICATE_ALT: 'Do not use the exact same words for both the alt and caption text. Screen readers will announce the information twice.<ul><li>The alt text should provide a concise description of what is in the image.</li><li>The caption should usually provide context to relate the image back to the surrounding content, or give attention to a particular piece of information.</li></ul> Learn more: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">alt versus figcaption.</a> <hr> <strong>Alt text:</strong> %(altText)',
  	  IMAGE_DECORATIVE: 'Image is marked as <strong>decorative</strong> and will be ignored by assistive technology. If the image conveys a story, mood or important information - be sure to add alt text.',
  	  IMAGE_ALT_TOO_LONG: 'Alt text description is <strong>too long</strong>. Alt text should be concise, yet meaningful like a <em>tweet</em> (around 100 characters). If this is a complex image or a graph, consider putting the long description of the image in the text below or an accordion component. <hr> <strong>Alt text (<span {r}>%(altLength)</span> characters):</strong> %(altText)',
  	  IMAGE_PASS: '<strong>Alt text:</strong> %(altText)',
    
  	  // Labels
  	  LABELS_MISSING_IMAGE_INPUT_MESSAGE: 'Image button is missing alt text. Please add alt text to provide an accessible name. For example: <em>Search</em> or <em>Submit</em>.',
  	  LABELS_INPUT_RESET_MESSAGE: 'Reset buttons should <strong>not</strong> be used unless specifically needed because they are easy to activate by mistake. <hr> <strong>Tip!</strong> Learn why <a href="https://www.nngroup.com/articles/reset-and-cancel-buttons/">Reset and Cancel buttons pose usability issues.</a>',
  	  LABELS_ARIA_LABEL_INPUT_MESSAGE: 'Input has an accessible name, although please ensure there is a visible label too. <hr> The accessible name for this input is: <strong>%(ariaLabel)</strong>',
  	  LABELS_NO_FOR_ATTRIBUTE_MESSAGE: 'There is no label associated with this input. Add a <code>for</code> attribute to the label that matches the <code>id</code> of this input. <hr> The ID for this input is: <strong>id=&#34;%(id)&#34;</strong>',
  	  LABELS_MISSING_LABEL_MESSAGE: 'There is no label associated with this input. Please add an <code>id</code> to this input, and add a matching <code>for</code> attribute to the label.',
    
  	  // Embedded content
  	  EMBED_VIDEO: 'Please ensure <strong>all videos have closed captioning.</strong> Providing captions for all audio and video content is a mandatory Level A requirement. Captions support people who are D/deaf or hard-of-hearing.',
  	  EMBED_AUDIO: 'Please ensure to provide a <strong>transcript for all podcasts.</strong> Providing transcripts for audio content is a mandatory Level A requirement. Transcripts support people who are D/deaf or hard-of-hearing, but can benefit everyone. Consider placing the transcript below or within an accordion panel.',
  	  EMBED_DATA_VIZ: 'Data visualization widgets like this are often problematic for people who use a keyboard or screen reader to navigate, and can present significant difficulties for people who have low vision or colorblindness. It\'s recommended to provide the same information in an alternative (text or table) format below the widget. <hr> Learn more about <a href="https://www.w3.org/WAI/tutorials/images/complex">complex images.</a>',
  	  EMBED_TWITTER: 'The default Twitter timeline may cause accessibility issues for people who use a keyboard to navigate. Secondly, the inline scrolling of the Twitter timeline may cause usability issues for mobile. It\'s recommended to add the following data attributes to the embed code. <hr> <strong>It\'s recommended to:</strong><ul><li>Add <code>data-tweet-limit=&#34;2&#34;</code> to limit the amount of tweets.</li><li>Add <code>data-chrome=&#34;nofooter noheader&#34;</code> to remove the widget\'s header and footer.</li></ul>',
  	  EMBED_MISSING_TITLE: 'Embedded content requires an accessible name that describes its contents. Please provide a unique <code>title</code> or <code>aria-label</code> attribute on the <code>iframe</code> element. Learn more about <a href="https://dequeuniversity.com/tips/provide-iframe-titles">iFrames.</a>',
  	  EMBED_GENERAL_WARNING: 'Unable to check embedded content. Please make sure that images have alt text, videos have captions, text has sufficient contrast, and interactive components are <a href="https://webaim.org/techniques/keyboard/">keyboard accessible.</a>',
    
  	  // Quality assurance
  	  QA_BAD_LINK: 'Bad link found. Link appears to point to a development environment. <hr> This link points to: <br> <strong {r}>%(el)</strong>',
  	  QA_BAD_ITALICS: 'Bold and italic tags have semantic meaning, and should <strong>not</strong> be used to highlight entire paragraphs. Bolded text should be used to provide strong <strong>emphasis</strong> on a word or phrase. Italics should be used to highlight proper names (i.e. book and article titles), foreign words, quotes. Long quotes should be formatted as a blockquote.',
  	  QA_PDF: 'PDFs are considered web content and must be made accessible as well. PDFs often contain issues for people who use screen readers (missing structural tags or missing form field labels) and people who have low vision (text does not reflow when enlarged). <ul><li>If this is a form, consider using an accessible HTML form as an alternative.</li><li>If this is a document, consider converting it into a web page.</li></ul>Otherwise, please check <strong {r}>%(pdfCount)</strong> <a href="https://www.adobe.com/accessibility/products/acrobat/using-acrobat-pro-accessibility-checker.html">PDF(s) for accessibility in Acrobat DC.</a>',
  	  QA_PAGE_LANGUAGE: 'Page language not declared! Please <a href="https://www.w3.org/International/questions/qa-html-language-declarations">declare language on HTML tag.</a>',
  	  QA_PAGE_TITLE: 'Missing page title! Please provide a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title">page title.</a>',
  	  QA_BLOCKQUOTE_MESSAGE: 'Is this a heading? <strong {r}>%(bqHeadingText)</strong> <hr> Blockquotes should be used for quotes only. If this is intended to be a heading, change this blockquote to a semantic heading (e.g. Heading 2 or Heading 3).',
  	  QA_FAKE_HEADING: 'Is this a heading? <strong {r}>%(boldtext)</strong> <hr> A line of bold text might look like a heading, but someone using a screen reader cannot tell that it is important or jump to its content. Bolded text should never replace semantic headings (Heading 2 to Heading 6).',
  	  QA_SHOULD_BE_LIST: 'Are you trying to create a list? Possible list item found: <strong {r}>%(firstPrefix)</strong> <hr> Make sure to use semantic lists by using the bullet or number formatting buttons instead. When using a semantic list, assistive technologies are able to convey information such as the total number of items and the relative position of each item in the list. Learn more about <a href="https://www.w3.org/WAI/tutorials/page-structure/content/#lists">semantic lists.</a>',
  	  QA_UPPERCASE_WARNING: 'Found all caps. Some screen readers may interpret all caps text as an acronym and will read each letter individually. Additionally, some people find all caps more difficult to read and it may give the appearance of SHOUTING.',
  	  QA_DUPLICATE_ID: 'Found <strong>duplicate ID</strong>. Duplicate ID errors are known to cause problems for assistive technologies when they are trying to interact with content. <hr> Please remove or change the following ID: <strong {r}>%(id)</strong>',
  	  QA_TEXT_UNDERLINE_WARNING: 'Underlined text can be confused with links. Consider using a different style such as <code>&lt;strong&gt;</code><strong>strong importance</strong><code>&lt;/strong&gt;</code> or <code>&lt;em&gt;</code><em>emphasis</em><code>&lt;/em&gt;</code>.',
    
  	  // Tables
  	  TABLES_MISSING_HEADINGS: 'Missing table headers! Accessible tables need HTML markup that indicates header cells and data cells which defines their relationship. This information provides context to people who use assistive technology. Tables should be used for tabular data only. <hr> Learn more about <a href="https://www.w3.org/WAI/tutorials/tables/">accessible tables.</a>',
  	  TABLES_SEMANTIC_HEADING: 'Semantic headings such as Heading 2 or Heading 3 should only be used for sections of content; <strong>not</strong> in HTML tables. Indicate table headings using the <code>&lt;th&gt;</code> element instead. <hr> Learn more about <a href="https://www.w3.org/WAI/tutorials/tables/">accessible tables.</a>',
  	  TABLES_EMPTY_HEADING: 'Empty table header found! Table headers should <strong>never</strong> be empty. It is important to designate row and/or column headers to convey their relationship. This information provides context to people who use assistive technology. Please keep in mind that tables should be used for tabular data only. <hr> Learn more about <a href="https://www.w3.org/WAI/tutorials/tables/">accessible tables.</a>',
    
  	  // Contrast
  	  CONTRAST_ERROR: 'This text does not have enough contrast with the background. The contrast ratio should be at least 4.5:1 for normal text and 3:1 for large text. <hr> The contrast ratio is <strong {r}>%(cratio)</strong> for the following text: <strong {r}>%(nodetext)</strong>',
  	  CONTRAST_WARNING: 'The contrast of this text is unknown and needs to be manually reviewed. Ensure the text and the background have strong contrasting colours. The contrast ratio should be at least 4.5:1 for normal text and 3:1 for large text. <hr> <strong>Please review:</strong> %(nodetext)',
  	  CONTRAST_INPUT_ERROR: 'Text within this input does not have enough contrast with the background. The contrast ratio should be at least 4.5:1 for normal text and 3:1 for large text. <hr> Contrast ratio: <strong {r}>%(cratio)</strong>',
  	},
    };

  var french = {
    // French
    strings: {
      LANG_CODE: 'fr',
      MAIN_TOGGLE_LABEL: 'Vérifier l’accessibilité',
      CONTAINER_LABEL: 'Vérificateur d’accessibilité',
      ERROR: 'Erreur',
      ERRORS: 'Erreurs',
      WARNING: 'Avertissement',
      WARNINGS: 'Avertissements',
      GOOD: 'Correct',
      ON: 'Allumer',
      OFF: 'Éteindre',
      ALERT_TEXT: 'Alerte',
      ALERT_CLOSE: 'Fermer',
      SHOW_OUTLINE: 'Schéma',
      HIDE_OUTLINE: 'Schéma',
      SHOW_SETTINGS: 'Paramètres',
      HIDE_SETTINGS: 'Paramètres',
      PAGE_OUTLINE: 'Page du schéma',
      SETTINGS: 'Paramètres',
      CONTRAST: 'Contraste',
      FORM_LABELS: 'Étiquettes de formulaires',
      LINKS_ADVANCED: 'Liens (avancés)',
      DARK_MODE: 'Mode sombre',
      SHORTCUT_SCREEN_READER: 'Passer à l’édition. Raccourci clavier: Alt et point',
      SHORTCUT_TOOLTIP: 'Passer à l’édition',
      NEW_TAB: 'Ouvrir dans un nouvel onglet',
      PANEL_HEADING: 'Vérification d’accessibilité',
      PANEL_STATUS_NONE: 'Aucune erreur trouvée.',
      PANEL_ICON_WARNINGS: 'avertissement(s) trouvé(s).',
      PANEL_ICON_TOTAL: 'problème(s) trouvé(s) au total.',
      NOT_VISIBLE_ALERT: 'L’élément que vous tentez de consulter n’est pas visible; il peut être masqué, à l’intérieur de l’accordéon ou dans le volet de l’onglet. Voir l’aperçu:',
      ERROR_MISSING_ROOT_TARGET: 'L\'accessibilité de la page entière a été vérifiée, car la zone cible <code><code>%(root)</code> n\'existe pas.',

      // Alternative text module stop words
      SUSPICIOUS_ALT_STOPWORDS: ['image', 'illustration', 'photo', 'photographie'],
      PLACEHOLDER_ALT_STOPWORDS: ['alt', 'image', 'photographie', 'décorative', 'photographie', 'support d’affichage', 'support d’affichage d’image', 'séparateur', '.'],
      PARTIAL_ALT_STOPWORDS: [
        'clic',
        'cliquer ici',
        'cliquer pour plus de détails',
        'cliquer ici pour plus d’informations',
        'cliquer ici pour plus d’informations.',
        'cocher',
        'télécharger',
        'télécharger ici',
        'télécharger ici.',
        'pour en savoir',
        'pour en savoir d’avantage',
        'pour en savoir d’avantage.',
        'pour en savoir d’avantage >',
        'formulaire',
        'ici',
        'ici.',
        'info',
        'information',
        'lien',
        'en apprendre',
        'en apprendre davantage',
        'en apprendre davantage.',
        'en apprendre davantage >',
        'davantage',
        'plus',
        'plus >',
        'page',
        'papier',
        'en savoir plus',
        'en savoir plus >',
        'lire',
        'lisez ceci',
        'ceci',
        'cette page',
        'cette page.',
        'ce site web',
        'ce site web.',
        'consulter',
        'consulter notre',
        'site web',
        '.',
      ],
      WARNING_ALT_STOPWORDS: ['< ', ' >', 'cliquer ici'],
      NEW_WINDOW_PHRASES: ['externe', 'nouvel onglet', 'nouvelle fenêtre', 'fenêtre pop-up', 'pop-up'],

      // Only some items in list would need to be translated.
      FILE_TYPE_PHRASES: ['document', 'feuille de calcul', 'feuille de travail', 'installation', 'vidéo', 'pdf', 'doc', 'docx', 'word', 'mp3', 'ppt', 'texte', 'pptx', 'PowerPoint', 'txt', 'exe', 'dmg', 'rtf', 'Windows OS', 'Mac OS', 'csv', 'xls', 'xlsx', 'mp4', 'mov', 'avi', 'zip'],

      // Readability
      LANG_READABILITY: 'Lisibilité',
      LANG_AVG_SENTENCE: 'Nombre de mots moyens par phrase:',
      LANG_COMPLEX_WORDS: 'Mots complexes:',
      LANG_TOTAL_WORDS: 'Mots:',
      LANG_VERY_DIFFICULT: 'Très difficile',
      LANG_DIFFICULT: 'Difficile',
      LANG_FAIRLY_DIFFICULT: 'Assez difficile',
      LANG_GOOD: 'Correct',
      READABILITY_NO_P_OR_LI_MESSAGE: 'Incapable de calculer le taux de lisibilité. Aucun paragraphe <code>&lt;p&gt;</code> ou liste de contenu <code>&lt;li&gt;</code> trouvé.',
      READABILITY_NOT_ENOUGH_CONTENT_MESSAGE: 'Pas suffisamment de contenu pour calculer le taux de lisibilité.',

      // Headings
      HEADING_NON_CONSECUTIVE_LEVEL: 'Utilisation d’un niveau d’en-tête non consécutif. Les en-têtes ne doivent jamais sauter de niveaux ou aller de <strong>L’en-tête %(prevLevel)</strong> à <strong {r}>L’en-tête %(level)</strong>.',
      HEADING_EMPTY: 'En-tête vide trouvé! Pour résoudre, supprimer cette ligne ou changer le format de <strong {r}>L’en-tête %(level)</strong> à <strong>Normal</strong> ou <strong>Paragraphe</strong>.',
      HEADING_LONG: 'L’en-tête est long! Les en-têtes doivent être utilisées pour organiser le contenu et acheminer la structure. Ils doivent être brefs, informatifs et uniques. Les en-têtes doi-vent être inférieures à 160 caractères (pas plus d’une phrase).<hr>Nombre de caractère(s): <strong {r}>%(headingLength)</strong>',
      HEADING_FIRST: 'Le premier en-tête sur la page doit être habituellement En-tête 1 ou En-tête 2. L’en-tête 1 doit débuter dans la section principale du contenu,  car il s\'agit de l’en-tête prin-cipal qui décrit l\'objectif général de la page. En savoir plus sur <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">La Structure Des En-têtes.</a>',
      HEADING_MISSING_ONE: 'En-tête 1 manquant. L’en-tête 1 doit débuter dans la zone principale de contenu, il est l’en-tête principal qui décrit l’objectif global de la page. En savoir plus sur <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">La Structure Des En-têtes. </a>',
      HEADING_EMPTY_WITH_IMAGE: 'L’en-tête ne contient pas de texte, mais seulement une image. Si ce n’est pas un en-tête, veuillez changer son format pour <strong {r}>L’en-tête %(level)</strong> à <strong>Normal</strong> ou <strong>Paragraphe</strong>. Sinon, veuillez ajouter du texte de remplacement à l’image si elle n’est pas décorative.',
      PANEL_HEADING_MISSING_ONE: 'En-tête 1 manquant!',

      // Links
      LINK_EMPTY: 'Retirer les liens vides sans texte.',
      LINK_EMPTY_LINK_NO_LABEL: 'Le lien ne comporte pas de texte perceptible par les lecteurs d\'écran ou autres techno-logies d\'assistance. À corriger: <ul><li>Ajoutez un texte bref qui décrit où le lien vous mène.</li><li>S’il s’agit d’un <a href="https://a11y-101.com/development/icons-and-links/">lien d’icône SVG (vectoriel), </a> il manque alors une description.</li><li>Si ce lien est une erreur due à un bogue de copier/coller, tentez de supprimer.</li></ul>',
      LINK_LABEL: '<strong>Lien de l’étiquette:</strong> %(linkText)',
      LINK_STOPWORD: 'Le texte du lien peut ne pas être suffisamment descriptif hors du contexte: <strong {r}>%(error)</strong><hr><strong>Conseil!</strong> Le texte du lien doit toujours être précis, unique et significatif. Évitez les mots courants comme &quot;cliquez ici&quot; ou &quot;en savoir plus&quot;.',
      LINK_BEST_PRACTICES: 'Remplacer le lien du texte: <strong {r}>%(error)</strong><hr><ul><li>&quot;Cliquer ici&quot; fait référence au mouvement de la souris, alors que de nombreuses personnes n\'utilisent pas de souris ou consultent peut-être ce site web sur un appareil mobile. Envisagez d\'utiliser un verbe différent qui se rapporte à la tâche.</li><li>Éviter l’utilisation de symbole HTML comme appel à l’action à moins qu\'ils ne soient cachés aux technologies d\'assistance.</li></ul>',
      LINK_URL: 'Des adresses URLs plus longues et moins compréhensibles utilisé en tant que lien de texte peuvent être difficiles à écouter avec une technologie d’assistance. Dans la plu-part des cas, il est recommandé d’utiliser du texte lisible plutôt qu’une adresse URL. Les adresses URL courtes (tels que les pages d’accueil de site web) sont correctes.<hr><strong>Conseil!</strong> Un lien de texte doit toujours être précis, unique et significatif pour qu\'il puisse être compris hors contexte.',

      // Links advanced
      NEW_TAB_WARNING: 'Le lien s’ouvre dans une nouvelle fenêtre ou un nouvel onglet sans avertissement.  Ce-la peut spécialement désorienter les gens qui ont une difficulté à percevoir le contenu visuel. Deuxièmement, ce n’est pas recommandé de contrôler l\'expérience d\'une per-sonne ou de prendre des décisions à sa place. Indiquer que le lient s’ouvrira dans une nouvelle fenêtre à l’intérieur du texte du lien.<hr><strong>Conseil!</strong> Apprenez les meilleures pratiques: <a href="https://www.nngroup.com/articles/new-browser-windows-and-tabs/">l’ouverture de lien dans les nouvelles fenêtres ou onglets des navigateurs.</a>',
      FILE_TYPE_WARNING: 'Le lien dirige vers un PDF ou un fichier téléchargeable (exemple: MP3, Zip, Word Doc) sans avertissements. Indiquer le type de fichier dans le lien du texte. S’il s’agit d’un fi-chier volumineux, envisagez d’inclure la taille du ficher.<hr><strong>Exemple:</strong> Rapport de synthèse (PDF, 3MB)',
      LINK_IDENTICAL_NAME: 'Le texte du lien est identique à  un autre, bien qu’il pointe vers une page différente. Des liens qui contiennent le même texte peuvent porter à confusion pour les gens qui utilisent des lecteurs d’écran.<hr>Ajoutez davantage de description au lien suivant pour le différencier de l’autre: <strong {r}>%(linkText)</strong>',

      // Images
      MISSING_ALT_LINK_BUT_HAS_TEXT_MESSAGE: 'L’image est utilisé en tant que lien avec un texte autour, alors que l’attribut de rem-placement doit être signalé comme décoratif ou nul.',
      MISSING_ALT_LINK_MESSAGE: 'L’image est utilisée en tant que lien mais manque de texte de remplacement! Veuillez vous assurer que le texte de remplacement décrit où le lien vous mène.',
      MISSING_ALT_MESSAGE: 'Texte de remplacement manquant! Si l’image transmet un message, une émotion ou des informations importantes - assurez-vous d’ajouter une description de l’image.',
      LINK_IMAGE_BAD_ALT_MESSAGE: 'L’extension du fichier trouvé à l’intérieur du texte de remplacement. Assurez-vous que le texte de remplacement décrit la destination du lien pas une description complète de l’image. Retirer: <strong {r}>%(error)</strong>.<hr><strong>Texte de remplacement: </strong> %(altText)',
      LINK_IMAGE_PLACEHOLDER_ALT_MESSAGE: 'Texte de remplacement non-descriptif ou séparateur trouvé dans une image. Assurez-vous que le texte de remplacement décrit la destination du lien, pas une description compète de l’image. Remplacer le texte de remplacement suivant: <strong {r}>%(altText)</strong>',
      LINK_IMAGE_SUS_ALT_MESSAGE: 'La technologie d’assistance indiquer déjà que c’est une image, donc &quot;<strong {r}>%(error)</strong>&quot; pourrait être redondant. Assurez-vous que le texte de remplacement décrit la destination du lien, pas la des-cription complète de l’image.<hr><strong>Texte de remplacement:</strong> %(altText)',
      LINK_ALT_HAS_BAD_WORD_MESSAGE: 'L’extension du fichier trouvé à l’intérieur du texte de remplacement. Si l’image trans-met un message, une émotion ou une information importante - assurez-vous d’ajouter une description de l’image. Retirer: <strong {r}>%(error)</strong>.<hr><strong>Texte de remplacement:</strong> %(altText)',
      ALT_PLACEHOLDER_MESSAGE: 'Texte de remplacement non-descriptif ou séparateur trouvé dans une image. Modifier le texte de remplacement suivant pour le rendre plus significatif: <strong {r}>%(altText)</strong>',
      ALT_HAS_SUS_WORD: 'Les technologies d’assistances indiquent déjà qu’il s’agit d’une image, donc &quot;<strong {r}>%(error)</strong>&quot; peut être redondant.<hr><strong>Texte de remplacement:</strong> %(altText)',
      LINK_IMAGE_ARIA_HIDDEN: 'Le lien autour de l’image a <code>aria-hidden=&quot;true&quot;</code> mais est toujours accessible au clavier. Si vous tentez de masquer un lien redondant ou dupliqué, ajouter <code>tabindex=&quot;-1&quot;</code> aussi.',
      LINK_IMAGE_NO_ALT_TEXT: 'L’image dans le lien est marquée comme décorative et il n’y a pas de lien de texte. Veuillez ajouter du texte de remplacement à l’image qui décrit la destination du lien.',
      LINK_IMAGE_HAS_TEXT: 'L’image est marqué comme étant décorative, bien que le lien utilise le texte autour en tant que description.',
      LINK_IMAGE_LONG_ALT: 'La description du texte de remplacement sur l’image lié est <strong>trop longue</strong>. Le texte de remplacement sur l’image liée devrait décrire où le lien vous mène, pas une description complète de l’image. <strong>Utilisez le titre de l’image en tant que lien du texte de remplacement.</strong><hr><strong>Texte de remplacement: (<span {r}>%(altLength)</span> caractères):</strong> %(altText)',
      LINK_IMAGE_ALT_WARNING: 'Le lien de l’image contient du texte de remplacement, mais assurez-vous que le texte de remplacement décrit la page de destination. <strong>Utilisez le titre de la page liée en tant que texte de remplacement.</strong> Est-ce que le texte de remplacement décrit où le lien vous mène?<hr><strong>Texte de remplacement:</strong> %(altText)',
      LINK_IMAGE_ALT_AND_TEXT_WARNING: 'Le lien de l’image contient <strong>du texte de remplacement et du texte à l’entour.</strong> Si cette image est décorative et est utilisé en tant que lien qui mène à une autre page, envisagez marquer l’image en tant que décorative, ou nulle - les liens texte autour de-vraient suffire.<hr><strong>Texte de remplacement:</strong> %(altText)',
      IMAGE_FIGURE_DECORATIVE: 'L’image est perçue de manière décorative <strong>décorative</strong> et sera ignorée par la technologie d’assistance. <hr>Bien qu’une <strong>légende</strong> est fournie, l’image devrait aussi avoir du texte de remplacement dans la plupart des cas.<ul><li>Le texte de remplacement devrait fournir une description précise de l’image.</li><li>La légende devrait fournir habituellement le contexte lié à l’image derrière le contenu environnant ou prêter attention à un élément d’information.</li></ul>En savoir plus: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">alt versus figcaption (légende de la figure). </a>',
      IMAGE_FIGURE_DUPLICATE_ALT: 'Ne pas utiliser le même mot pour la légende et le texte de remplacement. Les lecteurs d’écrans vont annoncer l’information en double.<ul><li>Le texte de remplacement devrait fournir une description précise de l’image.</li><li>La légende devrait fournir habituellement le contexte lié à l’image derrière le contenu environnant ou prêter attention à un élément d’information.</li></ul>En savoir plus: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">alt versus figcaption (légende de la figure).</a><hr><strong>Texte de remplacement:</strong> %(altText)',
      IMAGE_DECORATIVE: 'L’image est perçue de manière <strong>décorative</strong> et sera ignorée par la technologie d’assistance. Si l’image transmet un message, une émotion ou une information importante -  assurez-vous d’ajouter le texte de rempla-cement.',
      IMAGE_ALT_TOO_LONG: 'La description du texte de remplacement est <strong>trop longue</strong>. Le texte de remplacement doit être précis, mais significatif tout comme un <em>gazouillis (micromessage) </em> (environ 100 caractères). S’il s’agit d’une image complexe ou d’une illustration, ajoutez une longue description de l’image dans le texte ci-dessous ou dans la composante accordéon.<hr><strong>Texte de remplacement (<span {r}>%(altLength)</span> caractères):</strong> %(altText)',
      IMAGE_PASS: '<strong>Texte de remplacement:</strong> %(altText)',

      // Labels
      LABELS_MISSING_IMAGE_INPUT_MESSAGE: 'Le bouton de l’image manque un texte de remplacement. Veuillez ajouter un texte de remplacement pour fournir un nom accessible. Par exemple: <em>Rechercher</em> ou <em>Soumettre</em>.',
      LABELS_INPUT_RESET_MESSAGE: 'Le bouton réinitialiser <strong>ne devrait pas</strong> être utiliser sauf en cas de besoin spécifique, car il est facile de l’activer par erreur.<hr><strong>Conseil!</strong> En savoir plus sur <a href="https://www.nngroup.com/articles/reset-and-cancel-buttons/">les problèmes liés aux boutons Réinitialiser et Annuler.</a>',
      LABELS_ARIA_LABEL_INPUT_MESSAGE: 'L’entrée a un nom accessible, assurez-vouer qu’il y a aussi une étiquette visible.<hr>Le nom accessible pour cette entrée est: <strong>%(ariaLabel)</strong>',
      LABELS_NO_FOR_ATTRIBUTE_MESSAGE: 'Il n’y a pas d’étiquette associée à cette entrée. Ajouter en un <code>pour</code> l’attribut de l’étiquette qui correspond <code>id</code> à l’id(identifiant) de cette entrée.<hr>L’ID (L’identifiant) de cette entrée est: <code>id=&#34;%(id)&#34;</code>',
      LABELS_MISSING_LABEL_MESSAGE: 'Il n’y a pas d’étiquette associée à cette entrée. Veuillez ajouter un <code>id</code> id (identifiant) à cette entrée et ajouter un <code>for</code> attribut correspondant à l’étiquette.',

      // Embedded content
      EMBED_VIDEO: 'Assurez-vous <strong>que les vidéos ont des sous-titres codés.</strong> Fournir les sous-titres pour tout type de contenu audio ou vidéo est une exigence obli-gatoire de Niveau A. Les sous-titres aident les gens qui sont malentendants.',
      EMBED_AUDIO: 'Assurez-vous de fournir <strong>une transcription pour tous les balados.</strong> Fournir les transcriptions pour tout type de contenu audio est une exigence obligatoire de Niveau A. Les transcriptions aident les gens qui sont malentendant, mais peuvent profiter à tout le monde. Positionnez la transcription sous ou à l’intérieur du panneau accordéon.',
      EMBED_DATA_VIZ: 'Les gadgets logiciels de visualisation de données comme ceci sont souvent problématiques pour les gens qui utilisent un clavier ou un lecteur d’écran lors de la navigation et peuvent présenter d’importante difficultés pour les gens qui ont une malvoyance ou du daltonisme. Il est recommandé de fournir la même information de remplacement (texte ou tableau) dans le format ci-dessous du gadget logiciel.<hr>En savoir plus sur <a href="https://www.w3.org/WAI/tutorials/images/complex/">les images complexes.</a>',
      EMBED_TWITTER: 'L’interface par défaut de Twitter peut causer des problèmes d’accessibilité aux gens qui utilisent un clavier pour naviguer. Deuxièmement, la barre de défilement dans l’interface de Twitter peut causer des problèmes d’usage pour les appareils mobiles. Il est recommandé d’ajouter les attributs de données suivants pour intégrer le code.<hr><strong>Il est recommande:</strong><ul><li>D’ajouter <code>data-tweet-limit=&#34;2&#34;</code> pour limiter la quantité de gazouillis (Tweets).</li><li>D’ajouter <code>data-chrome=&#34;nofooter noheader&#34;</code> pour retirer le gadget logiciel de l’en-tête et du pied de la page.</li></ul>',
      EMBED_MISSING_TITLE: 'Le contenu intégré requiert un nom accessible qui décrit le contenu. Veuillez fournir un titre (<code>title</code>) unique ou <code>aria-label</code> un attribut à l’élément <code>iframe</code>. En savoir plus sur les <a href="https://developer.mozilla.org/fr/docs/Web/HTML/Element/iframe#une_iframe_simple">iFrames.</a>',
      EMBED_GENERAL_WARNING: 'Impossible de vérifier le contenu intégré. Assurez-vous que les images ont du texte de remplacement, les vidéos ont des sous-titres, le texte est suffisamment contrasté et que les éléments interactifs sont  <a href="https://webaim.org/techniques/keyboard/">accessible par le clavier. </a>',

      // Quality assurance
      QA_BAD_LINK: 'Lien incorrect trouvé. Le lien semble diriger vers un environnement de développement. Assurez vous que le lien ne contient pas <em>dev</em> ou <em>wp-admin</em> dans l’adresse URL.<hr>Le lien dirige vers:<br><strong {r}>%(el)</strong>',
      QA_BAD_ITALICS: 'Les balises Gras et Italique ont une signification sémantique et <strong>ne devraient pas</strong> être utiliser pour surligner des paragraphes en entier. Les textes en Gras doivent être utilisés pour mettre <strong>l’emphase</strong> sur un mot ou une phrase. Les textes en Italiques doivent être utilisés pour surligneur les noms propres (ex. livres et titre d’articles), les mots étrangers et les citations.  Les citations longues doivent être formatées comme une citation en bloc.',
      QA_PDF: 'Les PDFSs sont considérés comme contenu web et doivent être accessible comme tel. Les PDFs contiennent souvent des erreurs pour les gens qui utilisent les lecteurs d’écrans (balises structurelles manquante ou des champs de formulaire manquants) et les gens qui ont une malvoyance (le texte ne resurgit pas lorsqu’il est agrandi).<ul><li>S’il s’agit d’un formulaire, utilisez un formulaire HTML comme alternative.</li><li>S’il s’agit d’un document, convertissez-le en page web.</li></ul>Sinon, veuillez vérifier  <strong {r}>%(pdfCount)</strong> <a href="https://www.adobe.com/accessibility/products/acrobat/using-acrobat-pro-accessibility-checker.html">PDF pour assurer l’accessibilité dans Acrobat DC.</a>',
      QA_PAGE_LANGUAGE: 'La langue de la page n’est pas indiquée!  Veuillez <a href="https://www.w3.org/International/questions/qa-html-language-declarations.fr">indiquer la langue sur la balise HTML.</a>',
      QA_PAGE_TITLE: 'Titre de la page manquant ! Veuillez fournir un <a href="https://developer.mozilla.org/fr/docs/Web/HTML/Element/title">titre de page.</a>',
      QA_BLOCKQUOTE_MESSAGE: 'Est-ce un en-tête?  <strong {r}>%(bqHeadingText)</strong><hr>Les citations en bloc doivent être utilisées pour les citations uniquement. S’il s’agit d’un en-tête, changez cette citation en bloc pour un en-tête sémantique (ex. En-tête 2 ou En-tête 3).',
      QA_FAKE_HEADING: 'Est-ce un en-tête? <strong {r}>%(boldtext)</strong><hr>Une ligne de texte Gras peut ressembler à un en-tête, mais pour une personne utili-sant un lecteur d’écran, il est impossible de déterminer ce qui est important ou com-ment accéder au contenu. Le texte en Gras ne devrait jamais remplacer un en-tête sémantique (En-tête 2 à En-tête 6).',
      QA_SHOULD_BE_LIST: 'Voulez-vous créer une liste? Une liste d’élément possible est trouvée: <strong {r}>%(firstPrefix)</strong><hr>Assurez-vous de créer une liste en suivant le formatage de bouton, de puces ou de nombre. Lors d’une liste  relative, la technologie d’assistance est en mesure de transmettre l’information telle que le nombre total d’élément et la position relative de chaque élément sur la site. En savoir plus sur les <a href="https://www.w3.org/WAI/tutorials/page-structure/content/#lists">listes relatives. </a>',
      QA_UPPERCASE_WARNING: 'Majuscules trouvées. Certains lecteur d’écran pourraient interpréter les textes majus-cules en tant qu’acronyme et pourraient être tentés de les lire individuellement. De plus, certaines personnes trouvent les majuscules difficiles à lire et peuvent donner l’impression de CRIER.',
      QA_DUPLICATE_ID: 'ID (Identifiant) dupliqué trouvé. Les erreurs d’ID (d’identifiants) dupliqués sont re-connues pour causer des problèmes au niveau de la technologie d’assistance lors-qu’ils tentent d’interagir avec le contenu.<hr>Veuillez retirer ou modifier l’ID (l’identifiant) suivant: <strong {r}>%(id)</strong>',
      QA_TEXT_UNDERLINE_WARNING: 'Le texte soulignés peuvent être confondus avec les liens. Envisagez d’utiliser un style différent comme &lt;strong&gt;<strong>forte importance</strong>&lt;/strong&gt; ou &lt;em&gt;<em>l’emphase.</em>&lt;/em&gt;.',

      // Tables
      TABLES_MISSING_HEADINGS: 'En-têtes de tableau manquants! Les tableaux accessibles doivent contenir le balisage HTML pour indiquer la cellule de l’en-tête et la cellule des donnés qui déterminent leur relation. Cette information fournit le contexte aux gens qui utilisent la technolo-gie d’assistance. Les tableaux doivent être utilisés pour les données relatives uni-quement.<hr>En savoir plus sur les <a href="https://www.w3.org/WAI/tutorials/tables/">tableaux accessibles.</a>',
      TABLES_SEMANTIC_HEADING: 'Les en-têtes sémantiques tels que En-tête 2 ou En-tête 3 doivent être utilisées uni-quement pour les sections de contenu; non pas pour les tableaux HTML. Indiquez les en-têtes de tableau en utilisant plutôt l’élément <code>&lt;th&gt;</code>.<hr>En savoir plus sur les <a href="https://www.w3.org/WAI/tutorials/tables/">tableaux accessibles.</a>',
      TABLES_EMPTY_HEADING: 'En-tête de tableau vide trouvé! Les en-têtes de tableau ne devraient jamais être vides. Il est important de déterminer les rangées et/ou colonnes des en-têtes pour détermi-ner leur relation. Cette information fournit le contexte aux gens qui utilisent la tech-nologie d’assistance. Veuillez garder à l’esprit que les tableaux devraient être utilisés pour les données relatives uniquement.<hr>En savoir plus sur les <a href="https://www.w3.org/WAI/tutorials/tables/">tableaux accessibles.</a>',

      // Contrast
      CONTRAST_ERROR: 'Ce texte n’est pas suffisamment contrasté avec l’arrière-plan. Le ratio du contraste devrait être au moins de 4.5:1 pour le texte normal et 3:1 pour les textes plus grands.<hr>Le ratio du contraste est de <strong {r}>%(cratio)</strong> pour le texte suivant: <strong {r}>%(nodetext)</strong>',
      CONTRAST_WARNING: 'Le contraste de ce texte est inconnu et doit être manuellement révisé. Assurez-vous que le texte et l’arrière-plan représentent des couleurs contrastantes. Le ratio du con-traste devrait être au moins de 4.5:1 pour les textes normaux et 3:1 pour les textes plus grands.<hr><strong>Veuillez réviser:</strong> %(nodetext)',
      CONTRAST_INPUT_ERROR: 'Le texte à l’intérieur de cette entrée n’est pas suffisamment contrasté avec l’arrière-plan. Le ratio du contraste devraient être au moins de 4.5:1 pour le texte normal et 3:1 pour les textes plus grands.<hr>Ratio du contraste: <strong {r}>%(cratio)</strong>',
    },
  };

  var polish = {
    // Polish
    strings: {
      LANG_CODE: 'pl',
      MAIN_TOGGLE_LABEL: 'Testuj dostępność',
      CONTAINER_LABEL: 'Tester dostępności',
      ERROR: 'Błąd',
      ERRORS: 'Błędy',
      WARNING: 'Ostrzeżenie',
      WARNINGS: 'Ostrzeżenia',
      GOOD: 'Dobrze',
      ON: 'Wł',
      OFF: 'Wył',
      ALERT_TEXT: 'Alert',
      ALERT_CLOSE: 'Zamknij',
      SHOW_OUTLINE: 'Pokaż konspekt',
      HIDE_OUTLINE: 'Ukryj konspekt',
      SHOW_SETTINGS: 'Pokaż ustawienia',
      HIDE_SETTINGS: 'Ukryj ustawienia',
      PAGE_OUTLINE: 'Konspekt strony',
      SETTINGS: 'Ustawienia',
      CONTRAST: 'Kontrast',
      FORM_LABELS: 'Etykiety formularzy',
      LINKS_ADVANCED: 'Łącza (zaawansowane)',
      DARK_MODE: 'Tryb ciemny',
      SHORTCUT_SCREEN_READER: 'Przejdź do problemu. Klawisze skrótu: lewy Option',
      SHORTCUT_TOOLTIP: 'Przejdź do problemu',
      NEW_TAB: 'Otwórz na nowej karcie',
      PANEL_HEADING: 'Testuj dostępność',
      PANEL_STATUS_NONE: 'Nie znaleziono błędów.',
      PANEL_ICON_WARNINGS: 'ostrzeżeń do przeglądu.',
      PANEL_ICON_TOTAL: 'ogółem wykrytych problemów.',
      NOT_VISIBLE_ALERT: 'Element, który próbujesz wyświetlić, nie jest widoczny; może być ukryty lub znajdować się wewnątrz akordeonu lub karty. Tutaj jest podgląd:',
      ERROR_MISSING_ROOT_TARGET: 'Sprawdzono dostępność całej strony, ponieważ obszar docelowy nie istnieje: <code>%(root)</code>',

      // Alternative text module stop words
      SUSPICIOUS_ALT_STOPWORDS: ['obraz', 'grafika', 'zdjęcie', 'rysunek', 'fotografia', 'foto', 'image', 'graphic', 'picture', 'photo'],
      PLACEHOLDER_ALT_STOPWORDS: [
        'alt',
        'obraz',
        'foto',
        'fotografia',
        'dekoracja',
        'przykładowy tekst',
        'tekst przykładowy',
        'image',
        'photo',
        'decorative',
        'photo',
        'placeholder',
        'placeholder image',
        'spacer',
        '.',
      ],
      PARTIAL_ALT_STOPWORDS: [
        'kliknij',
        'kliknij tutaj',
        'kliknij tu',
        'kliknij tutaj, aby dowiedzieć się więcej',
        'kliknij tu, aby dowiedzieć się więcej',
        'kliknij tutaj, aby dowiedzieć się więcej.',
        'kliknij tutaj, aby dowiedzieć się więcej >',
        'check out',
        'pobierz',
        'pobierz tutaj',
        'pobierz tutaj.',
        'dowiedz się',
        'dowiedz się więcej',
        'dowiedz się więcej.',
        'dowiedz się więcej >',
        'formularz',
        'tutaj',
        'tutaj.',
        'info',
        'informacja',
        'link',
        'czytaj',
        'czytaj więcej',
        'czytaj więcej.',
        'czytaj więcej >',
        'czytaj to',
        'wiecej',
        'czytaj tu',
        'to',
        'tę stronę',
        'tej stronie.',
        'tej stronie >',
        'tę witrynę',
        'tej witrynie.',
        'tej witrynie >',
        'zobacz',
        'zobacz naszą',
        'stronę',
        'witrynę',
        '.',
      ],
      WARNING_ALT_STOPWORDS: ['< ', ' >', 'kliknij tutaj'],
      NEW_WINDOW_PHRASES: [
        'zewnętrzny',
        'nowa karta',
        'nowe okno',
        'pop-up',
        'pop up',
      ],

      // Only some items in list would need to be translated.
      FILE_TYPE_PHRASES: ['document', 'dokument', 'spreadsheet', 'worksheet', 'install', 'video', 'pdf', 'doc', 'docx', 'word', 'mp3', 'ppt', 'text', 'pptx', 'powerpoint', 'txt', 'exe', 'dmg', 'rtf', 'windows', 'macos', 'csv', 'xls', 'xlsx', 'mp4', 'mov', 'avi', 'zip'],

      // Readability
      LANG_READABILITY: 'Czytelność',
      LANG_AVG_SENTENCE: 'Średnio słów w zdaniu:',
      LANG_COMPLEX_WORDS: 'Trudne słowa:',
      LANG_TOTAL_WORDS: 'Słowa:',
      LANG_VERY_DIFFICULT: 'Bardzo trudne',
      LANG_DIFFICULT: 'Trudne',
      LANG_FAIRLY_DIFFICULT: 'Dość trudne',
      LANG_GOOD: 'Dobrze',
      READABILITY_NO_P_OR_LI_MESSAGE: 'Nie można oszacować wyników testu czytelności. Nie znaleziono treści w akapitach <code>&lt;p&gt;</code> lub listach <code>&lt;li&gt;</code>',
      READABILITY_NOT_ENOUGH_CONTENT_MESSAGE: 'Za mało treści, aby ocenić czytelność.',

      // Headings
      HEADING_NON_CONSECUTIVE_LEVEL: 'Niespójny poziom nagłówka. Zastosowane poziomy nie następują po sobie. Nagłówki nigdy nie powinny pomijać poziomów np. od <strong>Nagłówek %(prevLevel)</strong> do <strong {r}>Nagłówek %(level)</strong>.',
      HEADING_EMPTY: 'Znaleziono pusty nagłówek! Aby to naprawić, usuń tę linię lub zmień jej format z <strong {r}>Nagłówek %(level)</strong> na <strong>zwykły tekst</strong> lub <strong>akapit</strong>.',
      HEADING_LONG: 'Nagłówek jest zbyt długi! Nagłówki służą do organizowania treści i przekazywania struktury. Powinny być krótkie, jasne, opisowe i niepowtarzalne. Pisz nagłówki nie dłuższe niż 160 znaków (nie więcej niż zdanie).<hr>Liczba znaków: <strong {r}>%(headingLength)</strong>.',
      HEADING_FIRST: 'Pierwszym nagłówkiem na stronie powinien być zwykle Nagłówek H1 lub Nagłówek H2. Nagłówek H1 jest głównym nagłówkiem opisującym ogólny cel strony i powinien być początkiem obszaru treści głównej. Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">Strukturze nagłówków. </a>',
      HEADING_MISSING_ONE: 'Brakuje nagłówka H1. Nagłówek H1 jest głównym nagłówkiem opisującym ogólny cel strony i powinien być początkiem obszaru treści głównej. Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">Strukturze nagłówków.</a>',
      HEADING_EMPTY_WITH_IMAGE: 'Nagłówek nie ma tekstu, ale zawiera obrazek. Jeśli to nie jest nagłówek, zmień jego format z <strong {r}>Nagłówek H%(level)</strong> na <strong>zwykły tekst</strong> lub <strong>akapit</strong>. W przeciwnym razie, dodaj do obrazu tekst alt, jeśli nie jest on ozdobny.',
      PANEL_HEADING_MISSING_ONE: 'Brak Nagłówka 1!',

      // Links
      LINK_EMPTY: 'Puste łącze bez żadnego tekstu. Usuń je!',
      LINK_EMPTY_LINK_NO_LABEL: 'Łącze nie ma opisowego tekstu, który jest widoczny dla czytników ekranu i innych technologii wspomagających. Aby naprawić:<ul><li>Dodaj zwięzły tekst, który opisuje, dokąd prowadzi łącze.</li><li>Jeśli łączem jest <a href="https://a11y-101.com/development/icons-and-links">ikona lub SVG, </a> prawdopodobnie brakuje mu opisowej etykiety.</li><li>Jeśli uważasz, że to łącze jest błędem spowodowanym błędem kopiuj/wklej, rozważ usunięcie go.</li></ul>',
      LINK_LABEL: '<strong>Etykieta łącza:</strong> %(linkText)',
      LINK_STOPWORD: 'Tekst łącza może nie być wystarczająco opisowy w kontekście: <strong {r}>%(error)</strong><hr><strong>Porada!</strong> Tekst łącza powinien być zawsze jasny, unikalny i znaczący. Unikaj typowych słów takich jak &quot;kliknij tutaj&quot; lub &quot;czytaj więcej&quot;.',
      LINK_BEST_PRACTICES: 'Rozważ zastąpienie tekstu łącza: <strong {r}>%(error)</strong><hr><ul><li>&bdquo;Kliknij tutaj&rdquo; skupia się na mechanice myszy, podczas gdy wiele osób nie używa myszy lub może przeglądać tę stronę na urządzeniu mobilnym. Rozważ użycie innego czasownika, który odnosi się do zadania.</li><li>Unikaj używania symboli HTML jako wezwań do działania, chyba że są one ukryte dla technologii wspomagających.</li></ul>',
      LINK_URL: 'Dłuższe, mniej zrozumiałe adresy URL używane jako tekst odnośnika mogą być trudne do odsłuchania za pomocą technologii wspomagającej. W&nbsp;większości przypadków zamiast adresu URL lepiej jest używać tekstu czytelnego dla człowieka. Krótkie adresy URL (takie jak głównej strony witryny) są w porządku.<hr><strong>Porada!</strong> Tekst łącza powinien być zawsze jasny, unikalny i znaczący, aby mógł być zrozumiany bez kontekstu.',

      // Links advanced
      NEW_TAB_WARNING: 'Łącze otwiera się na nowej karcie lub w oknie bez ostrzeżenia. Może to być dezorientujące, szczególnie dla osób, które mają problemy z&nbsp;odbiorem treści wizualnych. Ponadto, nie zawsze dobrym zwyczajem jest kontrolowanie czyichś doświadczeń lub podejmowanie decyzji za kogoś. Wskaż w tekście łącza, że łącze otwiera się w nowym oknie.<hr><strong>Porada!</strong> Poznaj najlepsze praktyki: <a href="https://www.nngroup.com/articles/new-browser-windows-and-tabs/">otwieranie łączy w nowych oknach i kartach przeglądarki.</a>',
      FILE_TYPE_WARNING: 'Łącze wskazuje  bez ostrzeżenia na plik PDF lub plik do pobrania (np. MP3, zip, doc). Wskaż typ pliku w tekście łącza. Jeśli jest to duży plik, rozważ podanie jego rozmiaru.<hr><strong>Przykład:</strong> Raport końcowy (PDF, 3MB)',
      LINK_IDENTICAL_NAME: 'Łącze ma identyczny tekst jak inne łącze, choć wskazuje na inną stronę. Wiele łączy z takim samym tekstem może powodować zamieszanie u osób korzystających z czytników ekranu.<hr>Rozważ nadanie poniższemu łączu bardziej opisowego charakteru, aby odróżnić je od innych łączy: <strong {r}>%(linkText)</strong>',

      // Images
      MISSING_ALT_LINK_BUT_HAS_TEXT_MESSAGE: 'Obraz jest używany razem z sąsiadującym tekstem jako łącze. Obraz powinien być oznaczony jako dekoracyjny albo atrybut alt obrazu powinien być pusty.',
      MISSING_ALT_LINK_MESSAGE: 'Obraz jest używany jako łącze, ale brakuje tekstu alternatywnego! Dodaj tekst alternatywny, który mówi, dokąd prowadzi łącze.',
      MISSING_ALT_MESSAGE: 'Brak tekstu alternatywnego! Jeśli obraz przekazuje historię, nastrój lub ważne informacje - przedstaw je w tekście alternatywnym.',
      LINK_IMAGE_BAD_ALT_MESSAGE: 'W tekście alt znaleziono rozszerzenie nazwy pliku. Upewnij się, że tekst alternatywny opisuje miejsce docelowe łącza, a nie treść lub wygląd obrazu. Usuń wyraz(y): <strong {r}>%(error)</strong>.<hr><strong>Tekst alternatywny:</strong> %(altText)',
      LINK_IMAGE_PLACEHOLDER_ALT_MESSAGE: 'Znaleziono nieopisowy lub zastępczy tekst alt w obrazie będącym łączem. Upewnij się, że tekst alternatywny opisuje miejsce docelowe łącza, a nie treść lub wygląd obrazu. Zastąp następujący tekst alt: <strong {r}>%(altText)</strong>.',
      LINK_IMAGE_SUS_ALT_MESSAGE: 'Technologie wspomagające już wskazują, że jest to obraz, więc &quot;<strong {r}>%(error)</strong>&quot; mogą być zbędne. Upewnij się, że tekst alternatywny opisuje miejsce docelowe łącza, a nie treść lub wygląd obrazu.<hr><strong>Tekst alternatywny:</strong> %(altText)',
      LINK_ALT_HAS_BAD_WORD_MESSAGE: 'W tekście alt znaleziono rozszerzenie nazwy pliku. Upewnij się, że tekst alternatywny opisuje miejsce docelowe łącza, a nie treść lub wygląd obrazu. Usuń wyraz(y): <strong {r}>%(error)</strong>.<hr><strong>Tekst alternatywny:</strong> %(altText)',
      ALT_PLACEHOLDER_MESSAGE: 'Znaleziono nieopisowy lub zastępczy tekst alt. Zamień poniższy tekst alt na coś bardziej znaczącego: <strong {r}>%(altText)</strong>.',
      ALT_HAS_SUS_WORD: 'Technologie wspomagające już wskazują, że jest to obraz, więc &quot;<strong {r}>%(error)</strong>&quot; mogą być zbędne.<hr><strong>Tekst alternatywny:</strong> %(altText)',
      LINK_IMAGE_ARIA_HIDDEN: 'Łącze wokół obrazu ma <code>aria-hidden=&quot;true&quot;</code>, ale nadal można na nim ustawić fokus klawiatury. Jeśli chcesz ukryć zbędne lub zduplikowane łącze, dodaj również <code>tabindex=&quot;-1&quot;</code>',
      LINK_IMAGE_NO_ALT_TEXT: 'Obraz w łączu jest oznaczony jako dekoracyjny i nie ma tekstu łącza. Dodaj do obrazu tekst alt, który opisze miejsce docelowe łącza.',
      LINK_IMAGE_HAS_TEXT: 'Obraz jest oznaczony jako dekoracyjny, ale łącze używa otaczającego go tekstu jako etykiety opisowej.',
      LINK_IMAGE_LONG_ALT: 'Tekst alternatywny opisujący obraz będący łączem jest <strong>zbyt długi</strong>. Tekst alternatywny na obrazach bedących łączami powinien przedstawiać, dokąd prowadzi łącze, a nie dosłownie opisywać obraz. <strong>Rozważ użycie jako tekstu alternatywnego tytułu strony, do którego łączy obraz.</strong><hr><strong>Tekst alternatywny (<span {r}>%(altLength)</span> znaków):</strong> %(altText)',
      LINK_IMAGE_ALT_WARNING: 'Obraz będący łączem ma tekst alternatywny, ale upewnij się, że tekst alternatywny wskazuje na stronę docelową.<strong>Rozważ użycie jako tekstu alternatywnego tytułu strony, do którego łączy obraz.</strong>Czy tekst alternatywny mówi, dokąd prowadzi łącze?<hr><strong>Tekst alternatywny:</strong> %(altText)',
      LINK_IMAGE_ALT_AND_TEXT_WARNING: 'Łącze graficzne ma <strong>zarówno tekst alternatywny, jak i sąsiadujący tekst łącza.</strong> Jeśli ten obraz jest dekoracyjny i jest używany w funkcji łącza do innej strony, należy rozważyć oznaczenie obrazu jako dekoracyjnego (pusty alt) - sąsiadujący tekst łącza powinien wystarczyć.<hr><strong>Tekst alternatywny:</strong> %(altText)',
      IMAGE_FIGURE_DECORATIVE: 'Obraz jest oznaczony jako <strong>dekoracyjny</strong> i zostanie zignorowany przez technologię wspomagającą.<hr>Mimo że podano <strong>podpis</strong>, obraz powinien w większości przypadków zawierać również tekst alternatywny.<ul><li>Tekst alternatywny powinien zawierać zwięzły opis tego, co znajduje się na obrazku.</li><li>Podpis powinien zwykle zawierać kontekst, aby powiązać obraz z otaczającą zawartością lub zwracać uwagę na konkretną informację.</li></ul>Ucz się więcej: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">alternatywny kontra podpis graficzny.</a>',
      IMAGE_FIGURE_DUPLICATE_ALT: 'Nie używaj dokładnie tych samych słów dla tekstu alternatywnego i podpisu. Czytniki ekranu podadzą informację dwukrotnie.<ul><li>Tekst alternatywny powinien zawierać zwięzły opis tego, co znajduje się na obrazku.</li><li>Podpis powinien zwykle zawierać kontekst, aby powiązać obraz z otaczającą zawartością lub zwracać uwagę na konkretną informację.</li></ul>Ucz się więcej: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">alternatywny kontra podpis graficzny.</a><hr><strong>Tekst alternatywny:</strong> %(altText)',
      IMAGE_DECORATIVE: 'Obraz jest oznaczony <strong>dekoracyjny</strong> i zostanie zignorowany przez technologię wspomagającą. Jeśli obraz przekazuje jakąś historię, nastrój lub ważną informację - dodaj tekst alt.',
      IMAGE_ALT_TOO_LONG: 'Tekst alternatywny obrazu jest <strong>zbyt długi</strong>. Tekst alternatywny powinien być zwięzły, ale znaczący jak <em>tweet</em> (około 100 znaków). Jeśli jest to złożony obraz lub wykres, należy rozważyć umieszczenie długiego opisu obrazu w tekście poniżej lub w akordeonie.<hr><strong>Tekst alternatywny (<span {r}>%(altLength)</span> znaków):</strong> %(altText)',
      IMAGE_PASS: '<strong>Tekst alternatywny:</strong> %(altText)',

      // Labels
      LABELS_MISSING_IMAGE_INPUT_MESSAGE: 'Przycisk graficzny nie ma tekstu alternatywneego. Dodaj tekst alt, aby zapewnić dostępną nazwę. Na przykład: <em>Szukaj</em> lub <em>Wyślij</em>.',
      LABELS_INPUT_RESET_MESSAGE: 'Przyciski resetowania <strong>nie powinny</strong> być używane, chyba że są specjalnie potrzebne, ponieważ łatwo je aktywować przez pomyłkę.<hr><strong>Porada!</strong> Dowiedz się, dlaczego <a href="https://www.nngroup.com/articles/reset-and-cancel-buttons/">Przyciski Resetuj i Anuluj powodują problemy z użytecznością.</a>',
      LABELS_ARIA_LABEL_INPUT_MESSAGE: 'Pole danych ma dostępną nazwę (etykietę), ale upewnij się, że etykieta jest również widoczna.<hr>Dostępna nazwa tego pola to: <strong>%(ariaLabel)</strong>',
      LABELS_NO_FOR_ATTRIBUTE_MESSAGE: 'Z tym polem input nie jest skojarzona żadna etykieta (label). Dodaj atrybut <code>for</code> do etykiety z wartością <code>id</code>  pasującą do <code>id</code> tego pola.<hr>ID tego pola to: <strong>id=&#34;%(t)&#34;</strong>',
      LABELS_MISSING_LABEL_MESSAGE: 'Z tym polem input nie jest skojarzona żadna etykieta (label). Dodaj do tego pola danych <code>id</code> i dodaj pasujący atrybut <code>for</code> do etykiety.',

      // Embedded content
      EMBED_VIDEO: 'Upewnij się, że <strong>wszystkie filmy mają napisy rozszerzone.</strong> Zapewnianie napisów rozszerzonych dla wszystkich treści audio i wideo jest obowiązkowym wymogiem poziomu A. Napisy mają na celu wspieranie osób Głuchych i słabosłyszących.',
      EMBED_AUDIO: 'Upewnij się, że istnieje <strong>transkrypcja dla wszystkich nagrań dźwiękowych.</strong> Zapewnianie transkrypcji treści audio jest obowiązkowym wymogiem poziomu A. Transkrypcje mają na celu wspieranie osób Głuchych i słabosłyszących, ale każdy może z nich skorzystać. Rozważ umieszczenie transkrypcji poniżej lub w panelu akordeonowym.',
      EMBED_DATA_VIZ: 'Widżety wizualizacji danych, takie jak ten, są często problematyczne dla osób, które używają klawiatury lub czytnika ekranu do nawigacji, a także mogą stanowić znaczące trudności dla osób słabo widzących lub nie rozróżniających kolorów. Zapewnij te same infromacje w alternatywnym formacie (tekst lub tabela) pod widżetem.<hr>Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/images/complex/">obrazach złożonych.</a>',
      EMBED_TWITTER: 'Domyślna oś czasu Twittera może powodować problemy z dostępnością dla użytkowników klawiatury. Ponadto, przewijanie w linii osi czasu Twittera może powodować problemy z użytecznością na urządzeniach mobilnych. Zaleca się dodanie następujących atrybutów danych do kodu osadzającego oś czasu.<hr><strong>Zalecany kod:</strong><ul><li>Dodaj <code>data-tweet-limit=&#34;2&#34;</code>, aby ograniczyć ilość tweetów.</li><li>Dodaj <code>data-chrome=&#34;nofooter noheader&#34;</code>, aby usunąć nagłówek i stopkę widżetu.</li></ul>',
      EMBED_MISSING_TITLE: 'Osadzona zawartość wymaga dostępnej nazwy, która opisuje jej treść. Dodaj unikalny <code>title</code> lub atrybutu <code>aria-label</code> do elementu <code>iframe</code>. Dowiedz się więcej o <a href="https://dequeuniversity.com/tips/provide-iframe-titles">iFrame.</a>',
      EMBED_GENERAL_WARNING: 'Nie można sprawdzić treści osadzonej. Upewnij się, że obrazy mają tekst alt, filmy mają napisy rozszerzone, tekst ma odpowiedni kontrast, a elementy interaktywne są <a href="https://webaim.org/techniques/keyboard/">dostępne z klawiatury.</a>',

      // Quality assurance
      QA_BAD_LINK: 'Podejrzane łącze. Łącze wydaje się wskazywać środowisko programistyczne.<hr>Łącze wskazuje na:<br><strong {r}>%(el)</strong>',
      QA_BAD_ITALICS: 'Znaczniki pogrubienia i kursywy mają znaczenie semantyczne i <strong>nie powinny</strong> być używane do wyróżniania całych akapitów. Pogrubiony tekst powinien być używany w celu <strong>silnego podkreślenia słowa lub frazy</strong>. Kursywa powinna być używana do wyróżnienia nazw własnych (np. tytułów książek i artykułów), wyrazów obcych, cytatów. Długie cytaty powinny być sformatowane jako blockquote.',
      QA_PDF: 'Pliki PDF są uważane za treści internetowe i muszą być również dostępne. Pliki PDF często powodują problemy dla osób korzystających z&nbsp;czytników ekranu (brakujące znaczniki strukturalne lub etykiety pól formularzy) oraz dla osób słabowidzących (tekst nie jest ponownie wyświetlany po powiększeniu).<ul><li>Jeśli jest to formularz, rozważ użycie dostępnego formularza HTML jako alternatywy</li><li>Jeśli jest to dokument, rozważ przekonwertowanie go na stronę internetową.</li></ul>W przeciwnym razie <strong {r}>%(pdfCount)</strong> <a href="https://www.adobe.com/accessibility/products/acrobat/using-acrobat-pro-accessibility-checker.html">sprawdź plik pod kątem dostępności w programie Acrobat DC.</a>',
      QA_PAGE_LANGUAGE: 'Język strony nie zadeklarowany! <a href="https://www.w3.org/International/questions/qa-html-language-declarations">Zadeklaruj język w znaczniku HTML.</a>',
      QA_PAGE_TITLE: 'Brak tytułu strony! Podaj <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title">tytuł strony.</a>',
      QA_BLOCKQUOTE_MESSAGE: 'Czy to jest nagłówek? <strong {r}>%(bqHeadingText)</strong><hr>Element blockquote powinien być używany tylko do cytatów. Jeśli ma to być nagłówek, zmień ten blockquote na nagłówek semantyczny (np. Nagłówek H2 lub Nagłówek H3).',
      QA_FAKE_HEADING: 'Czy to jest nagłówek? <strong {r}>%(boldtext)</strong><hr>Wiersz pogrubionego tekstu może wyglądać jak nagłówek, ale osoba korzystająca z czytnika ekranu nie może stwierdzić, że jest on istotny lub przejść do jego treści. Pogrubiony tekst nigdy nie powinien zastępować nagłówków semantycznych (od Nagłówka H2 do Nagłówka H6).',
      QA_SHOULD_BE_LIST: 'Czy próbujesz utworzyć listę? Wykryto możliwe elementy listy: <strong {r}>%(firstPrefix)</strong><hr>Upewnij się, że używasz list semantycznych, zamiast stosowania znaków punktowania (np. myślników) lub liczb. Podczas korzystania z list semantycznych technologie wspomagające są w stanie przekazać takie informacje, jak ogólna liczba elementów i względna pozycja każdego elementu na liście. Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/page-structure/content/#lists">semantycznych listach. </a>',
      QA_UPPERCASE_WARNING: 'Wykryto WSZYSTKIE WIELKIE LITERY. Niektóre czytniki ekranu interpretują cały tekst wielkimi literami jako akronim i będą czytać każdą literę odrębnie. Ponadto, wszystkie wielkie litery są trudniejsze do odczytania i sprawiają wrażenie KRZYKU.',
      QA_DUPLICATE_ID: 'Znaleziono <strong>duplikat ID</strong>. Wiadomo, że błędy zduplikowanego ID powodują problemy dla technologii pomocniczych podczas próby interakcji z treścią.<hr>Usuń lub zmień następujący ID: <strong {r}>%(id)</strong>',
      QA_TEXT_UNDERLINE_WARNING: 'Podkreślony tekst można pomylić z linkami. Rozważ użycie innego stylu, takiego jak &lt;strong&gt;<strong>silne znaczenie</strong>&lt;/strong&gt; lub &lt;em&gt;<em>nacisk</em>&lt;/em&gt;.',

      // Tables
      TABLES_MISSING_HEADINGS: 'Brak nagłówków tabeli! Dostępne tabele wymagają znaczników HTML, które wskazują komórki nagłówków i komórki danych, które definiują ich relację. Informacje te zapewniają kontekst osobom korzystającym z technologii wspomagających. Tabele powinny być używane tylko dla danych tabelarycznych.<hr>Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/tables/">dostępnych tabelach. </a>',
      TABLES_SEMANTIC_HEADING: 'Nagłówki semantyczne, takie jak nagłówek H2 lub nagłówek H3, powinny być używane tylko w odniesieniu do sekcji treści; <strong>nie</strong> w tabelach HTML. Zamiast tego należy wskazać nagłówki tabeli przy użyciu elementu <strong>th</strong>.<hr>Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/tables/">dostępnych tabelach.</a>',
      TABLES_EMPTY_HEADING: 'Wykryto pusty nagłówek tabeli! Nagłówki tabel <em>nigdy</em> nie powinny być puste. Ważne jest, aby wyznaczyć nagłówki wierszy i/lub kolumn, aby przekazać ich relację. Informacje te zapewniają kontekst osobom korzystającym z technologii wspomagających. Należy pamiętać, że tabele powinny być używane tylko dla danych tabelarycznych.<hr>Dowiedz się więcej o <a href="https://www.w3.org/WAI/tutorials/tables/">dostępnych tabelach. </a>',

      // Contrast
      CONTRAST_ERROR: 'Ten tekst nie ma wystarczającego kontrastu z tłem Współczynnik kontrastu powinien wynosić co najmniej 4,5:1 dla zwykłego tekstu i 3:1 dla dużego tekstu.<hr>Współczynnik kontrastu wynosi <strong {r}>%(cratio)</strong> dla następującego tekstu:<strong {r}>%(nodetext)</strong>',
      CONTRAST_WARNING: 'Kontrast tego tekstu jest nieznany i wymaga ręcznego przeglądu. Upewnij się, że tekst i tło mają silne kontrastujące kolory. Współczynnik kontrastu powinien wynosić co najmniej 4,5:1 dla zwykłego tekstu i 3:1 dla dużego tekstu.<hr>Sprawdź kontrast następującego tekstu:<br><strong>%(nodetext)</strong>',
      CONTRAST_INPUT_ERROR: 'Text within this input does not have enough contrast with the background. The contrast ratio should be at least 4.5:1 for normal text and 3:1 for large text.<hr>Contrast ratio: <strong {r}>%(cratio)</strong>',
    },
  };

  var ukrainian = {
    // Ukrainian
    strings: {
      LANG_CODE: 'ua',
      MAIN_TOGGLE_LABEL: 'Перевірка доступності',
      CONTAINER_LABEL: 'Засіб перевірки доступності',
      ERROR: 'Помилка',
      ERRORS: 'Помилки',
      WARNING: 'Попередження',
      WARNINGS: 'Попередження',
      GOOD: 'Добре',
      ON: 'Увімкнено',
      OFF: 'Вимкнено',
      ALERT_TEXT: 'Попередження',
      ALERT_CLOSE: 'Закрити',
      SHOW_OUTLINE: 'Контури',
      HIDE_OUTLINE: 'Контури',
      SHOW_SETTINGS: 'Налаштування',
      HIDE_SETTINGS: 'Налаштування',
      PAGE_OUTLINE: 'Контури сторінки',
      SETTINGS: 'Налаштування',
      CONTRAST: 'Контраст',
      FORM_LABELS: 'Назви форми',
      LINKS_ADVANCED: 'Посилання (Розширені)',
      DARK_MODE: 'Темний режим',
      SHORTCUT_SCREEN_READER: 'Перейти до проблеми. Комбінація клавіш: Option крапка',
      SHORTCUT_TOOLTIP: 'Перейти до проблеми',
      NEW_TAB: 'Відкривається у новій вкладці',
      PANEL_HEADING: 'Перевірка доступності',
      PANEL_STATUS_NONE: 'Помилок не знайдено.',
      PANEL_ICON_WARNINGS: 'знайдені попередження.',
      PANEL_ICON_TOTAL: 'всього знайдених проблем.',
      NOT_VISIBLE_ALERT: 'Елемент, який ви намагаєтеся переглянути, не відображується; можливо, він прихований або знаходиться усередині компонента вкладки чи випадаючого списку («акордеону»). Ось попередній перегляд:',
      ERROR_MISSING_ROOT_TARGET: 'Було здійснено перевірку доступності всієї сторінки, оскільки цільова область <code>%(root)</code> не існує.',

      // Alternative text module stop words
      SUSPICIOUS_ALT_STOPWORDS: ['зображення', 'графічний об’єкт', 'малюнок', 'фото'],
      PLACEHOLDER_ALT_STOPWORDS: ['alt', 'зображення', 'фото', 'декоративне', 'фотографія', 'заповнювач', 'зображення-заповнювач', 'роздільник'],
      PARTIAL_ALT_STOPWORDS: [
        'натиснути',
        'натиснути тут',
        'натиснути тут щоб дізнатися більше',
        'натиснути тут для отримання додаткової інформації',
        'натиснути тут для отримання додаткової інформації.',
        'перевірити',
        'завантажити',
        'завантажити тут',
        'дізнатися',
        'дізнатися більше',
        'дізнатися більше.',
        'дізнатися більше >',
        'форма',
        'тут',
        'тут.',
        'інфа',
        'інформація',
        'посилання',
        'взнати',
        'взнати більше',
        'взнати більше.',
        'взнати більше >',
        'вивчити',
        'більше',
        'більше >',
        'сторінка',
        'стаття',
        'прочитати більше',
        'читати',
        'читати це',
        'читати це >',
        'це',
        'ця сторінка',
        'ця сторінка.',
        'цей вебсайт',
        'цей вебсайт.',
        'переглянути',
        'переглянути наш',
        'вебсайт',
        '.',
      ],
      WARNING_ALT_STOPWORDS: ['< ', ' >', 'натиснути тут'],
      NEW_WINDOW_PHRASES: ['зовнішнє', 'нова вкладка', 'нове вікно', 'спливаюче вікно', 'спливаючий елемент'],

      // Only some items in list would need to be translated.
      FILE_TYPE_PHRASES: ['документ', 'електронна таблиця', 'робочий аркуш', 'встановити', 'відео', 'pdf', 'пдФ', 'doc',
        'docx', 'word', 'mp3', 'ppt', 'текст', 'pptx', 'powerpoint', 'txt', 'exe', 'dmg', 'rtf', 'Віндовс', 'Мак', 'csv', 'xls', 'xlsx', 'mp4', 'mov', 'avi', 'zip'],

      // Readability
      LANG_READABILITY: 'Читабельність',
      LANG_AVG_SENTENCE: 'Середня кількість слів в одному реченні:',
      LANG_COMPLEX_WORDS: 'Складні слова:',
      LANG_TOTAL_WORDS: 'Слова:',
      LANG_VERY_DIFFICULT: 'Дуже складно',
      LANG_DIFFICULT: 'Складно',
      LANG_FAIRLY_DIFFICULT: 'Достатньо складно',
      LANG_GOOD: 'Добре',
      READABILITY_NO_P_OR_LI_MESSAGE: 'Неможливо визначити показник читабельності. Не знайдено жодного абзацу <code>&lt;p&gt;</code> або вмісту списку <code>&lt;li&gt;</code>.',
      READABILITY_NOT_ENOUGH_CONTENT_MESSAGE: 'Недостатньо вмісту для розрахунку оцінки читабельності.',

      // Headings
      HEADING_NON_CONSECUTIVE_LEVEL: 'Використано непослідовні рівні заголовків. Заголовки ніколи не повинні пропускати рівні або переходити від <strong>заголовка %(prevLevel)</strong> до <strong {r}>заголовка %(level)</strong>.',
      HEADING_EMPTY: 'Знайдено порожній заголовок! Щоб виправити, видаліть цей рядок або змініть його формат: замість <strong {r}>Заголовок %(level)</strong> оберіть <strong>Звичайний</strong> або <strong>Абзац</strong>.',
      HEADING_LONG: 'Заголовки задовгі! Заголовки слід використовувати для організації змісту та передачі структури. Вони мають бути короткими, інформативними та унікальними. Будь ласка, не виходьте за 160 символів (не більше одного речення).<hr>Кількість символів: <strong {r}>%(headingLength)</strong>',
      HEADING_FIRST: 'Першим заголовком на сторінці зазвичай повинен бути Заголовок 1 або Заголовок 2. Заголовок 1 має бути початком частини основного змісту та є основним заголовком, що описує загальну мету сторінки. Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">структуру заголовків.</a>',
      HEADING_MISSING_ONE: 'Відсутній Заголовок 1. Заголовок 1 повинен бути початком області основного змісту та є основним заголовком, який описує загальну мету сторінки. Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/">структуру заголовків.</a>',
      HEADING_EMPTY_WITH_IMAGE: 'Заголовок не має тексту, але містить зображення. Якщо це не заголовок, змініть його формат: замість <strong {r}>Заголовок %(level)</strong> поставте <strong>Звичайний</strong> або <strong>Абзац</strong>. В іншому разі додайте текст заміщення до зображення, якщо воно не є декоративним.',
      PANEL_HEADING_MISSING_ONE: 'Відсутній заголовок 1!',

      // Links
      LINK_EMPTY: 'Видаліть пусті посилання без тексту.',
      LINK_EMPTY_LINK_NO_LABEL: 'Посилання не має тексту для розпізнавання, який є видимим для читання з екрана та інших допоміжних технологій. Щоб виправити:<ul><li>Додайте короткий текст, який описує куди веде посилання.</li><li>У разі коли це посилання на <a href="https://a11y-101.com/development/icons-and-links">іконку або SVG, то, швидше за все, відсутній опис.</a></li><li>Якщо ви вважаєте, що це помилкове посилання викликане сбоєм копіювання/вставки, розгляньте його видалення.</li></ul>',
      LINK_LABEL: '<strong>Назва посилання:</strong> %(linkText)',
      LINK_STOPWORD: 'Текст посилання може бути недостатньо описовим поза контекстом: <strong {r}>%(error)</strong><hr><strong>Порада!</strong> Текст посилання завжди має бути чітким, унікальним та змістовним. Уникайте поширених слів типу &quot;натисніть тут&quot; або &quot;дізнатися більше&quot;.',
      LINK_BEST_PRACTICES: 'Розгляньте можливість заміни тексту посилання: <strong {r}>%(error)</strong><hr><ul><li>&quot;Натисніть тут&quot; стосується механіки миші, позаяк багато людей не користуються мишею або можуть переглядати цей вебсайт на мобільному пристрої. Розгляньте можливість використання іншого дієслова, що стосується виконання завдання.</li><li>Уникайте використання символів HTML у якості закликів до дії, якщо вони не приховані для допоміжних технологій.</li></ul>',
      LINK_URL: 'Довгі, менш розбірливі URL-адреси, які використовуються як текст посилання, можуть бути складними для прослуховування з використанням допоміжних технологій. У більшості випадків замість URL краще використовувати текст, придатний для читання людиною. Короткі URL-адреси (такі як  домашня сторінка сайту) цілком допустимі. <hr><strong>Порада!</strong> Текст посилання завжди має бути чітким, унікальним та значущім, щоб його можна було зрозуміти поза контекстом.',

      // Links advanced
      NEW_TAB_WARNING: 'Посилання відкривається у новій вкладці або вікні без попередження. Це може дезорієнтувати, особливо людей, які мають труднощі зі сприйняттям візуального контенту. До того ж, не завжди добре контролювати чийсь досвід чи приймати рішення за іншу особу. У тексті посилання вказуйте, що посилання відкривається у новому вікні. <hr> <strong>Порада!</strong> Вивчіть найкращі практики: <a href="https://www.nngroup.com/articles/new-browser-windows-and-tabs/">відкриття посилань у нових вікнах та вкладках браузера.</a>',
      FILE_TYPE_WARNING: 'Посилання вказує на PDF або файл, що завантажується (наприклад, MP3, Zip, Word Doc) без попередження. Вкажіть тип файлу у тексті посилання. Якщо це великий файл, вкажіть його розмір. <hr> <strong>Приклад:</strong> Виконавчий звіт (PDF, 3 МБ)',
      LINK_IDENTICAL_NAME: 'Посилання має той самий текст, що й інше посилання, але вказує на іншу сторінку. Декілька посилань з однаковим текстом можуть заплутати людей, які використовують програми для читання з екрана. <hr> Розгляньте можливість зробити наступне посилання більш описовим, щоб відрізнити його від інших посилань: <strong {r}>%(linkText)</strong>',

      // Images
      MISSING_ALT_LINK_BUT_HAS_TEXT_MESSAGE: 'Зображення використовується як посилання з оточуючим текстом, хоча атрибут текст заміщення повинен бути позначений як декоративний або нульовий.',
      MISSING_ALT_LINK_MESSAGE: 'Зображення використовується як посилання, але відсутній текст заміщення! Переконайтеся, що текст заміщення описує, куди веде посилання.',
      MISSING_ALT_MESSAGE: 'Відсутній текст заміщення! Якщо зображення передає історію, настрій або важливу інформацію, обов\'язково опишіть його.',
      LINK_IMAGE_BAD_ALT_MESSAGE: 'Знайдено розширення файлу в текст заміщенняі. Переконайтеся, що текст заміщення описує місце призначення посилання, а не надає дослівний опис зображення. Видалити: <strong {r}>%(error)</strong>. <hr> <strong>текст заміщення:</strong> %(altText)',
      LINK_IMAGE_PLACEHOLDER_ALT_MESSAGE: 'Виявлено не описовий або заповнюючий текст заміщення усередині зв\'язаного зображення. Переконайтеся, що текст заміщення визначає місце призначення посилання, а не надає дослівний опис зображення. Замініть наступний текст: <strong {r}>%(altText)</strong>',
      LINK_IMAGE_SUS_ALT_MESSAGE: 'Допоміжні технології вже вказують, що це зображення, тому &quot;<strong {r}>%(error)</strong>&quot; можуть бути зайвими. Переконайтеся, що текст заміщення описує місце призначення посилання, а не надає дослівний опис зображення. <hr> <strong>текст заміщення:</strong> %(altText)',
      LINK_ALT_HAS_BAD_WORD_MESSAGE: 'Знайдено розширення файлу в текст заміщенняі. Якщо зображення передає історію, настрій або важливу інформацію, обов\'язково опишіть його. Видалити: <strong {r}>%(error)</strong>. <hr> <strong>текст заміщення:</strong> %(altText)',
      ALT_PLACEHOLDER_MESSAGE: 'Виявлено не описовий або заповнюючий текст заміщення. Замініть наступний текст заміщення чимось більш значущим: <strong {r}>%(altText)</strong>',
      ALT_HAS_SUS_WORD: 'Допоміжні технології вже вказують, що це зображення, тому &quot;<strong {r}>%(error)</strong>&quot; можуть бути зайвими. <hr> <strong>текст заміщення:</strong> %(altText)',
      LINK_IMAGE_ARIA_HIDDEN: 'Посилання навколо зображення має <code>aria-hidden=&quot;true&quot;</code> але все одно фокусується клавіатурою. Якщо ви бажаєте приховати зайве або дубльоване посилання, додайте також: <code>tabindex=&quot;-1&quot;</code>',
      LINK_IMAGE_NO_ALT_TEXT: 'Зображення у посиланні позначене як декоративне, а текст посилання відсутній. Будь ласка, додайте до зображення текст заміщення, який визначає місце призначення посилання.',
      LINK_IMAGE_HAS_TEXT: 'Зображення позначене як декоративне, хоча посилання використовує навколишній текст як описову назву.',
      LINK_IMAGE_LONG_ALT: 'Опис текст заміщенняу на пов\'язаному зображенні <strong>занадто довгий.</strong> текст заміщення на пов\'язаних зображеннях повинен вказувати, куди веде посилання, а не містити дослівний опис зображення. <strong>Розгляньте можливість використання заголовка сторінки в якості текст заміщенняу, яку веде посилання.</strong> <hr> <strong>текст заміщення (<span {r}>%(altLength)</span> символів):</strong> %(altText)',
      LINK_IMAGE_ALT_WARNING: 'Посилання на зображення містить текст заміщення, однак переконайтеся, що текст заміщення описує сторінку місця призначення. <strong>Розгляньте можливість використання заголовка сторінки, на яку веде посилання, у якості текст заміщенняа.</strong> Чи описує текст заміщення, куди веде посилання? <hr> <strong>текст заміщення:</strong> %(altText)',
      LINK_IMAGE_ALT_AND_TEXT_WARNING: 'Посилання на зображення містить як текст заміщення, так і <strong>текст навколишнього посилання.</strong> Якщо зображення є декоративним і використовується як функціональне посилання на іншу сторінку, розгляньте можливість помітити зображення як декоративне або нульове ‒ тексту навколишнього посилання має бути достатньо. <hr> <strong>текст заміщення:</strong> %(altText)',
      IMAGE_FIGURE_DECORATIVE: 'Зображення позначене як <strong>декоративне</strong> та буде проігноровано допоміжними технологіями. <hr> Незважаючи на наявність підпису, у більшості випадків зображення також повинно містити текст заміщення.<ul><li>текст заміщення повинен містити короткий опис того, що зображенно.</li><li>Підпис зазвичай повинен надавати контекст, щоб встановити зв’язок зображення з навколишнім змістом, або привернути увагу до певної інформації.</li></ul>Дізнайтесь більше: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">: alt (текст заміщення) в порівнянні з figcaption (підписом).</a>',
      IMAGE_FIGURE_DUPLICATE_ALT: 'Не використовуйте однакові слова для текст заміщенняу та підпису. Пристрої читання з екрана будуть зчитувати їх двічі.<ul><li>текст заміщення повинен містити короткий опис того, що зображенно.</li><li>Підпис зазвичай повинен надавати контекст, щоб встановити зв’язок зображення з навколишнім змістом, або привернути увагу до певної інформації.</li></ul>Дізнайтесь більше: <a href="https://thoughtbot.com/blog/alt-vs-figcaption#the-figcaption-element">: alt (текст заміщення) в порівнянні з figcaption (підписом).</a><hr><strong>текст заміщення:</strong> %(altText)',
      IMAGE_DECORATIVE: 'Зображення позначене як <strong>декоративне</strong> та буде проігноровано допоміжними технологіями. Якщо зображення передає історію, настрій або важливу інформацію, переконайтесь, що до нього додано текст заміщення.',
      IMAGE_ALT_TOO_LONG: 'Опис текст заміщенняу задовгий. текст заміщення має бути коротким, але змістовним, як твіт (близько 100 символів). Якщо це складне зображення або діаграма, подумайте про те, щоб помістити довгий опис зображення в текст нижче або в компонент випадаючого списку (акордеону). <hr> <strong>текст заміщення (<span {r}>%(altLength)</span> символів):</strong> %(altText)',
      IMAGE_PASS: '<strong>текст заміщення:</strong> %(altText)',

      // Labels
      LABELS_MISSING_IMAGE_INPUT_MESSAGE: 'На кнопці зображення не вистачає текст заміщенняу. Будь ласка, додайте текст заміщення, щоб надати доступну назву. Наприклад: <em>Пошук</em> або <em>Подати</em>.',
      LABELS_INPUT_RESET_MESSAGE: 'Кнопки перезавантаження не слід використовувати без необхідності, оскільки їх легко активувати помилково. <hr> <strong>Порада!</strong> Дізнайтеся, чому <a href="https://www.nngroup.com/articles/reset-and-cancel-buttons/">кнопки перезавантаження та відміни викликають проблеми зі зручністю використання.</a>',
      LABELS_ARIA_LABEL_INPUT_MESSAGE: 'Введення має доступне ім\'я, проте, будь ласка, переконайтеся, що у нього є видимий підпис. <hr> Доступне ім\'я для цього введення: <strong>%(ariaLabel)</strong>',
      LABELS_NO_FOR_ATTRIBUTE_MESSAGE: 'Із цим введенням не пов\'язана жодна назва. Додайте атрибут <code>for</code> що відповідає ідентифікатору цього входу. <hr> Ідентифікатор цього входу: <strong>id=&#34;%(id)&#34;</strong>',
      LABELS_MISSING_LABEL_MESSAGE: 'Із цим введенням не пов\'язана жодна назва. Будь ласка, додайте <code>id</code> до цього введення та додайте відповідний атрибут <code>for</code> до назви.',

      // Embedded content
      EMBED_VIDEO: 'Будь ласка, переконайтеся, що всі <strong>відеоматеріали мають приховані титри.</strong> Надання титрів для всіх аудіо- та відеоматеріалів є обов\'язковою вимогою рівня А. Титри допомагають людям з порушенням слуху або глухотою.',
      EMBED_AUDIO: 'Будь ласка, забезпечте транскрипцію всіх подкастів. Надання розшифровки аудіоконтенту є обов\'язковою вимогою рівня А. Транскрипція допомагає людям з порушенням слуху або глухотою, але можуть бути корисні всім. Розгляньте можливість розміщення транскрипції нижче або всередині випадаючого списку (акордеону).',
      EMBED_DATA_VIZ: 'Віджети візуалізації даних, подібні до цього, часто викликають труднощі у людей, які використовують клавіатуру або програму читання з екрана для навігації, і можуть становити значні труднощі для людей із слабким зором або дальтоніків. Рекомендується надавати ту саму інформацію в альтернативному (текстовому або табличному) форматі під віджетом. <hr> Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/images/complex/"> комплексні зображення.</a>',
      EMBED_TWITTER: 'Стрічка Twitter, яка використовується за замовчанням, може викликати проблеми з доступністю для людей, які використовують клавіатуру для навігації. До того ж, вбудована прокрутка стрічки Twitter може викликати проблеми зі зручністю використання для мобільних пристроїв. Рекомендується додати наступні атрибути даних до коду вставки. <hr> <strong>Рекомендується:</strong><ul><li>Додайте <code>data-tweet-limit=&#34;2&#34;</code> щоб обмежити кількість твітів.</li><li>Додайте <code>data-chrome=&#34;nofooter noheader&#34;</code> щоб видалити заголовок та виноску віджету.</li></ul>',
      EMBED_MISSING_TITLE: 'Вбудований контент потребує доступної назви, що описує його вміст. Вкажіть унікальний заголовок (<code>title</code>) або атрибут <code>aria-label</code> на елементі <code>iframe</code>. Дізнайтесь більше про <a href="https://dequeuniversity.com/tips/provide-iframe-titles">iFrames.</a>',
      EMBED_GENERAL_WARNING: 'Неможливо перевірити вбудований вміст. Будь ласка, переконайтеся, що зображення мають текст заміщення, до відео є титри, текст має достатній контраст, а інтерактивні <a href="https://webaim.org/techniques/keyboard/">компоненти доступні для клавіатури.</a>',

      // Quality assurance
      QA_BAD_LINK: 'Знайдено неякісне посилання. Схоже, що посилання вказує на середовище розробки. <hr> Це посилання вказує на: <br> <strong {r}>%(el)</strong>',
      QA_BAD_ITALICS: 'Теги жирним шрифтом і курсивом мають змістовне значення і <strong>не</strong> повинні використовуватися для виділення цілих абзаців. Жирний текст слід використовувати для виділення слова або фрази. Курсив слід використовувати для виділення власних назв (наприклад, назв книг і статей), іноземних слів, цитат. Довгі цитати слід оформлювати як блокові цитати.',
      QA_PDF: 'PDF-файли вважаються веб-контентом і повинні бути доступні. PDF-файли часто створюють проблеми для користувачів програм читання з екрана (відсутні структурні теги або відсутні мітки полів форми) і для людей зі слабким зором (текст не розгортається під час збільшення).<ul><li>Якщо це форма, розгляньте можливість використання доступної HTML-форми у якості альтернативи.</li><li>Якщо це документ, розгляньте можливість перетворення його на веб-сторінку.</li></ul>В іншому випадку, перевірте <strong {r}>%(pdfCount)</strong> <a href="https://www.adobe.com/accessibility/products/acrobat/using-acrobat-pro-accessibility-checker.html">файли PDF на доступність у Acrobat DC.</a>',
      QA_PAGE_LANGUAGE: 'Мова сторінки не вказана! Будь ласка, <a href="https://www.w3.org/International/questions/qa-html-language-declarations">вкажіть мову в тезі HTML.</a>',
      QA_PAGE_TITLE: 'Відсутня назва сторінки! <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title">Укажіть назву сторінки.</a>',
      QA_BLOCKQUOTE_MESSAGE: 'Це заголовок? <strong {r}>%(bqHeadingText)</strong> <hr> Блок-цитати слід використовувати лише для цитат. Якщо це задумано як заголовок, змініть блокову цитату на змістовний заголовок (наприклад, Заголовок 2 або Заголовок 3).',
      QA_FAKE_HEADING: 'Це заголовок? <strong {r}>%(boldtext)</strong><hr>Рядок жирного тексту може виглядати як заголовок, але людина, яка використовує програму читання з екрана, не зможе визначити його важливість або перейти до його змісту. Жирний текст ніколи не повинен замінювати змістовні заголовки (від заголовка 2 до заголовка 6).',
      QA_SHOULD_BE_LIST: 'Ви намагаєтесь створити список? Знайдено можливий елемент списку: <strong {r}>%(firstPrefix)</strong> <hr> Переконайтеся, що ви використовуєте змістовні списки, вживаючи маркування або нумерацію. У разі використання змістовного списку допоміжні технології можуть передавати таку інформацію, як загальна кількість елементів та відносне положення кожного елемента у списку. Дізнайтесь більше про <a href="https://www.w3.org/WAI/tutorials/page-structure/content/#lists">змістовні списки.</a>',
      QA_UPPERCASE_WARNING: 'Знайдено  текст великими літерами. Деякі програми читання з екрана можуть інтерпретувати текст, написаний великими літерами, як абревіатуру і читати кожну літеру окремо. Крім того, деяким людям важче читати текст, написаний великими літерами, і він може виглядати як КРИК.',
      QA_DUPLICATE_ID: 'Виявлено <strong>дублікат ID</strong>. Відомо, що помилки дублювання ID можуть викликати проблеми для допоміжних технологій, коли вони намагаються взаємодіяти із вмістом. <hr> Будь ласка, видаліть або змініть наступний ідентифікатор: <strong {r}>%(id)</strong>',
      QA_TEXT_UNDERLINE_WARNING: 'Підкреслений текст можна переплутати з посиланнями. Розгляньте можливість використання іншого стилю, наприклад &lt;strong&gt;<strong>сильного акценту</strong>&lt;/strong&gt; або &lt;em&gt;<em>наголос</em>&lt;/em&gt;.',

      // Tables
      TABLES_MISSING_HEADINGS: 'Відсутні заголовки таблиць! Доступні таблиці потребують HTML-розмітки, яка вказує на клітинки заголовків та клітинки даних, визначаючи їх взаємозв\'язок. Ця інформація надає контекст для людей, які використовують допоміжні технології. Таблиці слід використовувати лише для табличних даних. <hr> Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/tables/">доступні таблиці.</a>',
      TABLES_SEMANTIC_HEADING: 'Семантичні заголовки, такі як Заголовок 2 або Заголовок 3, слід використовувати лише для розділів вмісту; над таблицях HTML. Вказуйте заголовки таблиць за допомогою елемента <code>&lt;th&gt;</code>. <hr> Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/tables/">доступні таблиці.</a>',
      TABLES_EMPTY_HEADING: 'Знайдено порожній заголовок таблиці! Заголовки таблиць ніколи не повинні бути порожніми. Важливо позначати заголовки рядків та/або стовпців, щоб передавати їх зв\'язок. Ця інформація забезпечує контекст для людей, які використовують допоміжні технології. Пам\'ятайте, що таблиці слід використовувати лише для табличних даних. Дізнайтеся більше про доступні таблиці. <hr> Дізнайтеся більше про <a href="https://www.w3.org/WAI/tutorials/tables/">доступні таблиці.</a>',

      // Contrast
      CONTRAST_ERROR: 'Цей текст недостатньо контрастний щодо фону. Коефіцієнт контрастності має бути не менше 4,5:1 для звичайного тексту та 3:1 для великого тексту. <hr> Коефіцієнт контрастності становить <strong {r}>%(cratio)</strong> для даного тексту: <strong {r}>%(nodetext)</strong>',
      CONTRAST_WARNING: 'Контрастність цього тексту не встановлена і потребує перевірки вручну. Переконайтеся, що текст і фон мають різко контрастні кольори. Коефіцієнт контрастності має бути не менше 4,5:1 для звичайного тексту та 3:1 для великого тексту. <hr> <strong>Будь ласка, перевірте:</strong> %(nodetext)',
      CONTRAST_INPUT_ERROR: 'Текст у цьому введенні недостатньо контрастний щодо фону. Коефіцієнт контрастності має бути не менше 4,5:1 для звичайного тексту та 3:1 для великого. <hr> Коефіцієнт контрастності: <strong {r}>%(cratio)</strong>',
    },
  };

  function findLanguage() {
  	let language = document.getElementsByTagName("html")[0].getAttribute("lang");
  	if (language === "en") {
  		return en;
  	} else if (language === "fr"){
          return french;
      }else if (language === "pl"){
          return polish;
      }else if (language === "ua"){
          return ukrainian;
      }
  }

  const Lang = {
  	langStrings: findLanguage(),
  	addI18n(strings) {
  	  this.langStrings = strings;
  	},
  	_(string) {
  	  return this.translate(string);
  	},
  	sprintf(string, ...args) {
  	  let transString = this._(string);
  	  if (args && args.length) {
  		args.forEach((arg) => {
  		  transString = transString.replace(/%\([a-zA-z]+\)/, arg);
  		});
  	  }
  	  return transString;
  	},
  	translate(string) {
  	  return this.langStrings["strings"][string] || string;
  	},
    };

  function buildSa11yUI() {
  	const MainToggleIcon =
  		"<svg role='img' focusable='false' width='35px' height='35px' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='#ffffff' d='M256 48c114.953 0 208 93.029 208 208 0 114.953-93.029 208-208 208-114.953 0-208-93.029-208-208 0-114.953 93.029-208 208-208m0-40C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 56C149.961 64 64 149.961 64 256s85.961 192 192 192 192-85.961 192-192S362.039 64 256 64zm0 44c19.882 0 36 16.118 36 36s-16.118 36-36 36-36-16.118-36-36 16.118-36 36-36zm117.741 98.023c-28.712 6.779-55.511 12.748-82.14 15.807.851 101.023 12.306 123.052 25.037 155.621 3.617 9.26-.957 19.698-10.217 23.315-9.261 3.617-19.699-.957-23.316-10.217-8.705-22.308-17.086-40.636-22.261-78.549h-9.686c-5.167 37.851-13.534 56.208-22.262 78.549-3.615 9.255-14.05 13.836-23.315 10.217-9.26-3.617-13.834-14.056-10.217-23.315 12.713-32.541 24.185-54.541 25.037-155.621-26.629-3.058-53.428-9.027-82.141-15.807-8.6-2.031-13.926-10.648-11.895-19.249s10.647-13.926 19.249-11.895c96.686 22.829 124.283 22.783 220.775 0 8.599-2.03 17.218 3.294 19.249 11.895 2.029 8.601-3.297 17.219-11.897 19.249z'/></svg>";

  	const sa11ycontainer = document.createElement("div");
  	sa11ycontainer.setAttribute("id", "sa11y-container");
  	sa11ycontainer.setAttribute("role", "region");
  	sa11ycontainer.setAttribute("lang", Lang._("LANG_CODE"));
  	sa11ycontainer.setAttribute("aria-label", Lang._("CONTAINER_LABEL"));

  	const loadContrastPreference =
  		localStorage.getItem("sa11y-remember-contrast") === "On";
  	const loadLabelsPreference =
  		localStorage.getItem("sa11y-remember-labels") === "On";
  	const loadChangeRequestPreference =
  		localStorage.getItem("sa11y-remember-links-advanced") === "On";
  	const loadReadabilityPreference =
  		localStorage.getItem("sa11y-remember-readability") === "On";

  	sa11ycontainer.innerHTML =
  		`<button type="button" aria-expanded="false" id="sa11y-toggle" aria-describedby="sa11y-notification-badge" aria-label="${Lang._(
			"MAIN_TOGGLE_LABEL"
		)}" disabled>
			  ${MainToggleIcon}
			  <div id="sa11y-notification-badge">
				  <span id="sa11y-notification-count"></span>
				  <span id="sa11y-notification-text" class="sa11y-visually-hidden"></span>
			  </div>
		  </button>` +
  		// Start of main container.
  		'<div id="sa11y-panel">' +
  		// Page Outline tab.
  		`<div id="sa11y-outline-panel" role="tabpanel" aria-labelledby="sa11y-outline-header">
		  <div id="sa11y-outline-header" class="sa11y-header-text">
			  <h2 tabindex="-1">${Lang._("PAGE_OUTLINE")}</h2>
		  </div>
		  <div id="sa11y-outline-content">
			  <ul id="sa11y-outline-list"></ul>
		  </div>` +
  		// Readability tab.
  		`<div id="sa11y-readability-panel">
			  <div id="sa11y-readability-content">
				  <h2 class="sa11y-header-text-inline">${Lang._("LANG_READABILITY")}</h2>
				  <p id="sa11y-readability-info"></p>
				  <ul id="sa11y-readability-details"></ul>
			  </div>
		  </div>
	  </div>` + // End of Page Outline tab.
  		// Settings tab.
  		`<div id="sa11y-settings-panel" role="tabpanel" aria-labelledby="sa11y-settings-header">
		  <div id="sa11y-settings-header" class="sa11y-header-text">
			  <h2 tabindex="-1">${Lang._("SETTINGS")}</h2>
		  </div>
		  <div id="sa11y-settings-content">
			  <ul id="sa11y-settings-options">
				  <li id="sa11y-contrast-li">
					  <label id="sa11y-check-contrast" for="sa11y-contrast-toggle">${Lang._(
							"CONTRAST"
						)}</label>
					  <button id="sa11y-contrast-toggle"
					  aria-labelledby="sa11y-check-contrast"
					  class="sa11y-settings-switch"
					  aria-pressed="${loadContrastPreference ? "true" : "false"}">${
			loadContrastPreference ? Lang._("ON") : Lang._("OFF")
		}</button></li>
				  <li id="sa11y-form-labels-li">
					  <label id="sa11y-check-labels" for="sa11y-labels-toggle">${Lang._(
							"FORM_LABELS"
						)}</label>
					  <button id="sa11y-labels-toggle" aria-labelledby="sa11y-check-labels" class="sa11y-settings-switch"
					  aria-pressed="${loadLabelsPreference ? "true" : "false"}">${
			loadLabelsPreference ? Lang._("ON") : Lang._("OFF")
		}</button>
				  </li>
				  <li id="sa11y-links-advanced-li">
					  <label id="check-changerequest" for="sa11y-links-advanced-toggle">${Lang._(
							"LINKS_ADVANCED"
						)} <span class="sa11y-badge">AAA</span></label>
					  <button id="sa11y-links-advanced-toggle" aria-labelledby="check-changerequest" class="sa11y-settings-switch"
					  aria-pressed="${loadChangeRequestPreference ? "true" : "false"}">${
			loadChangeRequestPreference ? Lang._("ON") : Lang._("OFF")
		}</button>
				  </li>
				  <li id="sa11y-readability-li">
					  <label id="check-readability" for="sa11y-readability-toggle">${Lang._(
							"LANG_READABILITY"
						)} <span class="sa11y-badge">AAA</span></label>
					  <button id="sa11y-readability-toggle" aria-labelledby="check-readability" class="sa11y-settings-switch"
					  aria-pressed="${loadReadabilityPreference ? "true" : "false"}">${
			loadReadabilityPreference ? Lang._("ON") : Lang._("OFF")
		}</button>
				  </li>
				  <li>
					  <label id="sa11y-dark-mode" for="sa11y-theme-toggle">${Lang._(
							"DARK_MODE"
						)}</label>
					  <button id="sa11y-theme-toggle" aria-labelledby="sa11y-dark-mode" class="sa11y-settings-switch"></button>
				  </li>
			  </ul>
		  </div>
	  </div>` +
  		// Console warning messages.
  		`<div id="sa11y-panel-alert">
		  <div class="sa11y-header-text">
			  <button id="sa11y-close-alert" class="sa11y-close-btn" aria-label="${Lang._(
					"ALERT_CLOSE"
				)}" aria-describedby="sa11y-alert-heading sa11y-panel-alert-text"></button>
			  <h2 id="sa11y-alert-heading">${Lang._("ALERT_TEXT")}</h2>
		  </div>
		  <p id="sa11y-panel-alert-text"></p>
		  <div id="sa11y-panel-alert-preview"></div>
	  </div>` +
  		// Main panel that conveys state of page.
  		`<div id="sa11y-panel-content">
		  <button id="sa11y-cycle-toggle" type="button" aria-label="${Lang._(
				"SHORTCUT_SCREEN_READER"
			)}">
			  <div class="sa11y-panel-icon"></div>
		  </button>
		  <div id="sa11y-panel-text"><h1 class="sa11y-visually-hidden">${Lang._(
				"PANEL_HEADING"
			)}</h1>
		  <p id="sa11y-status" aria-live="polite"></p>
		  </div>
	  </div>` +
  		// Show Outline & Show Settings button.
  		`<div id="sa11y-panel-controls" role="tablist" aria-orientation="horizontal">
		  <button type="button" role="tab" aria-expanded="false" id="sa11y-outline-toggle" aria-controls="sa11y-outline-panel">
			  ${Lang._("SHOW_OUTLINE")}
		  </button>
		  <button type="button" role="tab" aria-expanded="false" id="sa11y-settings-toggle" aria-controls="sa11y-settings-panel">
			  ${Lang._("SHOW_SETTINGS")}
		  </button>
		  <div style="width:40px;"></div>
	  </div>` +
  		// End of main container.
  		"</div>";
  	const pagebody = document.getElementsByTagName("BODY")[0];
  	pagebody.prepend(sa11ycontainer);
  }

  const ERROR = Lang._("ERROR");
  const WARNING = Lang._("WARNING");
  const GOOD = Lang._("GOOD");

  let errorCount = 0;
  let warningCount = 0;
  let panelActive = true;
  function setPanel(value) {
  	panelActive = value;
  }
  function setWarning(value) {
  	warningCount = value;
  }
  function setError(value) {
  	errorCount = value;
  }

  /* Exclusions */
  // Container ignores apply to self and children.
  if (option.containerIgnore) {
  	const containerSelectors = option.containerIgnore
  		.split(",")
  		.map((el) => `${el} *, ${el}`);

  	option.containerIgnore = `[aria-hidden], [data-tippy-root] *, #sa11y-container *, #wpadminbar *, ${containerSelectors.join(
		", "
	)}`;
  } else {
  	option.containerIgnore =
  		"[aria-hidden], [data-tippy-root] *, #sa11y-container *, #wpadminbar *";
  }
  let containerIgnore = option.containerIgnore;

  // Contrast exclusions
  let contrastIgnore = `${containerIgnore}, .sa11y-heading-label, script`;
  {
  	contrastIgnore = `${option.contrastIgnore}, ${contrastIgnore}`;
  }

  // Ignore specific regions for readability module.
  let readabilityIgnore = `${containerIgnore}, nav li, [role="navigation"] li`;

  // Ignore specific headings
  let headerIgnore = containerIgnore;

  // Ignore specific images.
  let imageIgnore = `${containerIgnore}, [role='presentation'], [src^='https://trck.youvisit.com']`;

  // Ignore specific links
  let linkIgnore = `${containerIgnore}, [aria-hidden="true"], .anchorjs-link`;
  {
  	linkIgnore = `${option.linkIgnore}, ${linkIgnore}`;
  }

  // Ignore specific classes within links.
  if (option.linkIgnoreSpan) {
  	const linkIgnoreSpanSelectors = option.linkIgnoreSpan
  		.split(",")
  		.map((el) => `${el} *, ${el}`);
  	option.linkIgnoreSpan = `noscript, ${linkIgnoreSpanSelectors.join(", ")}`;
  } else {
  	option.linkIgnoreSpan = "noscript";
  }

  /* Embedded content sources */
  // Video sources.
  if (option.videoContent) {
  	const videoContent = option.videoContent
  		.split(/\s*[\s,]\s*/)
  		.map((el) => `[src*='${el}']`);
  	option.videoContent = `video, ${videoContent.join(", ")}`;
  } else {
  	option.videoContent = "video";
  }

  // Audio sources.
  if (option.audioContent) {
  	const audioContent = option.audioContent
  		.split(/\s*[\s,]\s*/)
  		.map((el) => `[src*='${el}']`);
  	option.audioContent = `audio, ${audioContent.join(", ")}`;
  } else {
  	option.audioContent = "audio";
  }

  // Data viz sources.
  if (option.dataVizContent) {
  	const dataVizContent = option.dataVizContent
  		.split(/\s*[\s,]\s*/)
  		.map((el) => `[src*='${el}']`);
  	option.dataVizContent = dataVizContent.join(", ");
  } else {
  	option.dataVizContent = "datastudio.google.com, tableau";
  }

  // Twitter timeline sources.
  if (option.twitterContent) {
  	const twitterContent = option.twitterContent
  		.split(/\s*[\s,]\s*/)
  		.map((el) => `[class*='${el}']`);
  	option.twitterContent = twitterContent.join(", ");
  } else {
  	option.twitterContent = "twitter-timeline";
  }

  // Embedded content all
  if (option.embeddedContent) {
  	const embeddedContent = option.embeddedContent
  		.split(/\s*[\s,]\s*/)
  		.map((el) => {
  			if (el === "twitter-timeline") {
  				return `[class*='${el}']`;
  			}
  			return `[src*='${el}']`;
  		});
  	option.embeddedContent = embeddedContent.join(", ");
  }

  // Check if content is hidden
  const isElementHidden = ($el) => {
  	if (
  		$el.getAttribute("hidden") ||
  		($el.offsetWidth === 0 && $el.offsetHeight === 0)
  	) {
  		return true;
  	}
  	const compStyles = getComputedStyle($el);
  	return compStyles.getPropertyValue("display") === "none";
  };

  const computeTextNodeWithImage = ($el) => {
  	const imgArray = Array.from($el.querySelectorAll("img"));
  	let returnText = "";
  	// No image, has text.
  	if (imgArray.length === 0 && $el.textContent.trim().length > 1) {
  		returnText = $el.textContent.trim();
  	} else if (imgArray.length && $el.textContent.trim().length === 0) {
  		// Has image.
  		const imgalt = imgArray[0].getAttribute("alt");
  		if (!imgalt || imgalt === " " || imgalt === "") {
  			returnText = " ";
  		} else if (imgalt !== undefined) {
  			returnText = imgalt;
  		}
  	} else if (imgArray.length && $el.textContent.trim().length) {
  		// Has image and text.
  		// To-do: This is a hack? Any way to do this better?
  		imgArray.forEach((element) => {
  			element.insertAdjacentHTML(
  				"afterend",
  				` <span class='sa11y-clone-image-text' aria-hidden='true'>${imgArray[0].getAttribute(
					"alt"
				)}</span>`
  			);
  		});
  		returnText = $el.textContent.trim();
  	}
  	return returnText;
  };
  const sanitizeForHTML = (string) => {
  	const entityMap = {
  		"&": "&amp;",
  		"<": "&lt;",
  		">": "&gt;",
  		'"': "&quot;",
  		"'": "&#39;",
  		"/": "&#x2F;",
  		"`": "&#x60;",
  		"=": "&#x3D;",
  	};
  	return String(string).replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
  };

  const findVisibleParent = (element, property, value) => {
  	let $el = element;
  	while ($el !== null) {
  		const style = window.getComputedStyle($el);
  		const propValue = style.getPropertyValue(property);
  		if (propValue === value) {
  			return $el;
  		}
  		$el = $el.parentElement;
  	}
  	return null;
  };

  const offsetTop = ($el) => {
  	const rect = $el.getBoundingClientRect();
  	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  	return {
  		top: rect.top + scrollTop,
  	};
  };

  const escapeHTML = (text) => {
  	const $div = document.createElement("div");
  	$div.textContent = text;
  	return $div.innerHTML
  		.replaceAll('"', "&quot;")
  		.replaceAll("'", "&#039;")
  		.replaceAll("`", "&#x60;");
  };

  const fnIgnore = (element, selector) => {
  	const $clone = element.cloneNode(true);
  	const $exclude = Array.from(
  		selector ? $clone.querySelectorAll(selector) : $clone.children
  	);
  	$exclude.forEach(($c) => {
  		$c.parentElement.removeChild($c);
  	});
  	return $clone;
  };

  const computeAriaLabel = (el) => {
  	// aria-label
  	if (el.matches("[aria-label]")) {
  		return el.getAttribute("aria-label");
  	}
  	// aria-labeledby.
  	if (el.matches("[aria-labelledby]")) {
  		const target = el.getAttribute("aria-labelledby").split(/\s+/);
  		if (target.length > 0) {
  			let returnText = "";
  			target.forEach((x) => {
  				const targetSelector = document.querySelector(`#${x}`);
  				if (targetSelector === null) {
  					returnText += " ";
  				} else if (targetSelector.hasAttribute("aria-label")) {
  					returnText += `${targetSelector.getAttribute("aria-label")}`;
  				} else {
  					returnText += `${targetSelector.firstChild.nodeValue} `;
  				}
  			});
  			return returnText;
  		}
  		return "";
  	}
  	// Child with aria-label
  	if (
  		Array.from(el.children).filter((x) => x.matches("[aria-label]")).length > 0
  	) {
  		const child = Array.from(el.childNodes);
  		let returnText = "";

  		// Process each child within node.
  		child.forEach((x) => {
  			if (x.nodeType === 1) {
  				if (x.ariaLabel === null) {
  					returnText += x.innerText;
  				} else {
  					returnText += x.getAttribute("aria-label");
  				}
  			} else {
  				returnText += x.nodeValue;
  			}
  		});
  		return returnText;
  	}
  	// Child with aria-labelledby
  	if (
  		Array.from(el.children).filter((x) => x.matches("[aria-labelledby]"))
  			.length > 0
  	) {
  		const child = Array.from(el.childNodes);
  		let returnText = "";

  		// Process each child within node.
  		child.forEach((y) => {
  			if (y.nodeType === 3) {
  				returnText += y.nodeValue;
  			} else {
  				const target = y.getAttribute("aria-labelledby").split(/\s+/);
  				if (target.length > 0) {
  					let returnAria = "";
  					target.forEach((z) => {
  						if (document.querySelector(`#${z}`) === null) {
  							returnAria += " ";
  						} else {
  							returnAria += `${
								document.querySelector(`#${z}`).firstChild.nodeValue
							} `;
  						}
  					});
  					returnText += returnAria;
  				}
  			}
  			return "";
  		});
  		return returnText;
  	}
  	return "noAria";
  };

  const nudge = () => {
  	const sa11yInstance = document.querySelectorAll(
  		".sa11y-instance, .sa11y-instance-inline"
  	);
  	sa11yInstance.forEach(($el) => {
  		const sibling = $el.nextElementSibling;
  		if (
  			sibling !== null &&
  			(sibling.classList.contains("sa11y-instance") ||
  				sibling.classList.contains("sa11y-instance-inline"))
  		) {
  			sibling
  				.querySelector("button")
  				.setAttribute("style", "margin: -10px -20px !important;");
  		}
  	});
  };

  const detectOverflow = () => {
  	const findParentWithOverflow = (element, property, value) => {
  		let $el = element;
  		while ($el !== null) {
  			const style = window.getComputedStyle($el);
  			const propValue = style.getPropertyValue(property);
  			if (propValue === value) {
  				return $el;
  			}
  			$el = $el.parentElement;
  		}
  		return null;
  	};
  	const $findButtons = document.querySelectorAll(".sa11y-btn");
  	$findButtons.forEach(($el) => {
  		const overflowing = findParentWithOverflow($el, "overflow", "hidden");
  		if (overflowing !== null) {
  			overflowing.classList.add("sa11y-overflow");
  		}
  	});
  };

  function findElements () {
  	let container = document.querySelector(option.checkRoot);
  	let readabilityContainer = document.querySelector(option.readabilityRoot);

  	// Error handling. If target area does not exist, scan body.
  	if (!container) {
  		container = document.querySelector("body");
  	} else {
  		container = document.querySelector(option.checkRoot);
  	}

  	if (!readabilityContainer) {
  		readabilityContainer = document.querySelector("body");
  	} else {
  		readabilityContainer = document.querySelector(option.readabilityRoot);
  	}

  	// Sa11y's panel container
  	document.getElementById("sa11y-container");

  	// Exclusions constants
  	const containerExclusions = Array.from(
  		document.querySelectorAll(containerIgnore)
  	);
  	const readabilityExclusions = Array.from(
  		document.querySelectorAll(readabilityIgnore)
  	);

  	// Exclusions constants
  	//  const containerExclusions = Array.from(document.querySelectorAll(this.containerIgnore));
  	//  const readabilityExclusions = Array.from(document.querySelectorAll(this.readabilityIgnore));

  	//Contrast
  	const $findcontrast = Array.from(container.querySelectorAll("*"));
  	const excludeContrast = Array.from(
  		container.querySelectorAll(contrastIgnore)
  	);
  	let $contrast = $findcontrast.filter(($el) => !excludeContrast.includes($el));

  	// Readability
  	let $findreadability = Array.from(
  		readabilityContainer.querySelectorAll("p, li")
  	);

  	// Inputs
  	const $findinputs = Array.from(
  		container.querySelectorAll("input, select, textarea")
  	);
  	let $inputs = $findinputs.filter(
  		($el) => !containerExclusions.includes($el) && !isElementHidden($el)
  	);

  	// Links
  	const $findlinks = Array.from(container.querySelectorAll("a[href]"));
  	const excludelinks = Array.from(container.querySelectorAll(linkIgnore));
  	let $links = $findlinks.filter(($el) => !excludelinks.includes($el));

  	//Paragraphs
  	const $findp = Array.from(container.querySelectorAll("p"));
  	let $p = $findp.filter(($el) => !containerExclusions.includes($el));

  	// Headings
  	const allHeadings = Array.from(
  		container.querySelectorAll(
  			"h1, h2, h3, h4, h5, h6, [role='heading'][aria-level]"
  		)
  	);
  	const excludeHeadings = Array.from(container.querySelectorAll(headerIgnore));
  	let $h = allHeadings.filter(($el) => !excludeHeadings.includes($el));

  	const allH1 = Array.from(
  		document.querySelectorAll("h1, [role='heading'][aria-level='1']")
  	);
  	let $h1 = allH1.filter(($el) => !excludeHeadings.includes($el));

  	// Images
  	const images = Array.from(container.querySelectorAll("img"));
  	const excludeimages = Array.from(container.querySelectorAll(imageIgnore));
  	let $img = images.filter(($el) => !excludeimages.includes($el));

  	// iFrames
  	const $findiframes = Array.from(
  		container.querySelectorAll("iframe, audio, video")
  	);
  	let $iframes = $findiframes.filter(
  		($el) => !containerExclusions.includes($el)
  	);
  	$iframes.filter(($el) => $el.matches(option.videoContent));
  	$iframes.filter(($el) => $el.matches(option.audioContent));
  	$iframes.filter(($el) => $el.matches(option.dataVizContent));
  	$iframes.filter(($el) => $el.matches(option.twitterContent));
  	$iframes.filter(
  		($el) => !$el.matches(option.embeddedContent)
  	);

  	//Blockquotes
  	const $findblockquotes = Array.from(container.querySelectorAll("blockquote"));
  	let $blockquotes = $findblockquotes.filter(
  		($el) => !containerExclusions.includes($el)
  	);

  	// Error handling for readability.
  	if (!$findreadability) ; else {
  		$findreadability = Array.from(
  			readabilityContainer.querySelectorAll("p, li")
  		);
  	}
  	let $readability = $findreadability.filter(
  		($el) => !readabilityExclusions.includes($el)
  	);

  	return {
  		readability: $readability,
  		inputs: $inputs,
  		link: $links,
  		p: $p,
  		h: $h,
  		h1: $h1,
  		images: $img,
  		iframe: $iframes,
  		blockquotes: $blockquotes,
  		$contrast: $contrast,
  	};
  }

  function resetAll (restartPanel = true){
  	setPanel(false);

  	const html = document.querySelector('html');
  	html.removeAttribute('data-sa11y-active');

  	// Remove eventListeners on the Show Outline and Show Panel toggles.
  	const $outlineToggle = document.getElementById('sa11y-outline-toggle');
  	const resetOutline = $outlineToggle.cloneNode(true);
  	$outlineToggle.parentNode.replaceChild(resetOutline, $outlineToggle);

  	const $settingsToggle = document.getElementById('sa11y-settings-toggle');
  	const resetSettings = $settingsToggle.cloneNode(true);
  	$settingsToggle.parentNode.replaceChild(resetSettings, $settingsToggle);

  	// Reset all classes on elements.
  	const resetClass = (el) => {
  	  el.forEach((x) => {
  		document.querySelectorAll(`.${x}`).forEach((y) => y.classList.remove(x));
  	  });
  	};
  	resetClass(['sa11y-error-border', 'sa11y-error-text', 'sa11y-warning-border', 'sa11y-warning-text', 'sa11y-good-border', 'sa11y-good-text', 'sa11y-overflow', 'sa11y-fake-heading', 'sa11y-pulse-border', 'sa11y-fake-list']);

  	const allcaps = document.querySelectorAll('.sa11y-warning-uppercase');
  	allcaps.forEach((el) => el.outerHTML = el.innerHTML);

  	// Remove
  	document.querySelectorAll(`
			  .sa11y-instance,
			  .sa11y-instance-inline,
			  .sa11y-heading-label,
			  #sa11y-outline-list li,
			  .sa11y-readability-period,
			  #sa11y-readability-info span,
			  #sa11y-readability-details li,
			  .sa11y-clone-image-text
		  `).forEach((el) => el.parentNode.removeChild(el));

  	// Alert within panel.
  	document.querySelector('#sa11y-panel-alert').classList.remove('sa11y-active');

  	const empty = document.querySelector('#sa11y-panel-alert-text');
  	while (empty.firstChild) empty.removeChild(empty.firstChild);

  	const emptyPreview = document.querySelector('#sa11y-panel-alert-preview');
  	while (emptyPreview.firstChild) emptyPreview.removeChild(emptyPreview.firstChild);
  	emptyPreview.classList.remove('sa11y-panel-alert-preview');

  	// Main panel warning and error count.
  	const clearStatus = document.querySelector('#sa11y-status');
  	while (clearStatus.firstChild) clearStatus.removeChild(clearStatus.firstChild);

  	if (restartPanel) {
  	  document.querySelector('#sa11y-panel').classList.remove('sa11y-active');
  	}
    }

  function updateBadge() {
  	const totalCount = errorCount + warningCount;
  	const notifBadge = document.getElementById("sa11y-notification-badge");
  	const notifCount = document.getElementById("sa11y-notification-count");
  	const notifText = document.getElementById("sa11y-notification-text");

  	if (totalCount === 0) {
  		notifBadge.style.display = "none";
  	} else if (warningCount > 0 && errorCount === 0) {
  		notifBadge.style.display = "flex";
  		notifBadge.classList.add("sa11y-notification-badge-warning");
  		notifCount.innerText = `${warningCount}`;
  		notifText.innerText = `${Lang._("PANEL_ICON_WARNINGS")}`;
  	} else {
  		notifBadge.style.display = "flex";
  		notifBadge.classList.remove("sa11y-notification-badge-warning");
  		notifCount.innerText = `${totalCount}`;
  		notifText.innerText = Lang._("PANEL_ICON_TOTAL");
  	}
  }

  function buildPanel() {
  	const $outlineToggle = document.getElementById("sa11y-outline-toggle");
  	const $outlinePanel = document.getElementById("sa11y-outline-panel");
  	const $outlineList = document.getElementById("sa11y-outline-list");
  	const $settingsToggle = document.getElementById("sa11y-settings-toggle");
  	const $settingsPanel = document.getElementById("sa11y-settings-panel");
  	const $settingsContent = document.getElementById("sa11y-settings-content");
  	const $headingAnnotations = document.querySelectorAll(".sa11y-heading-label");

  	// Show outline panel
  	$outlineToggle.addEventListener("click", () => {
  		if ($outlineToggle.getAttribute("aria-expanded") === "true") {
  			$outlineToggle.classList.remove("sa11y-outline-active");
  			$outlinePanel.classList.remove("sa11y-active");
  			$outlineToggle.textContent = `${Lang._("SHOW_OUTLINE")}`;
  			$outlineToggle.setAttribute("aria-expanded", "false");
  			localStorage.setItem("sa11y-remember-outline", "Closed");
  		} else {
  			$outlineToggle.classList.add("sa11y-outline-active");
  			$outlinePanel.classList.add("sa11y-active");
  			$outlineToggle.textContent = `${Lang._("HIDE_OUTLINE")}`;
  			$outlineToggle.setAttribute("aria-expanded", "true");
  			localStorage.setItem("sa11y-remember-outline", "Opened");
  		}

  		// Set focus on Page Outline heading for accessibility.
  		document.querySelector("#sa11y-outline-header > h2").focus();

  		// Show heading level annotations.
  		$headingAnnotations.forEach(($el) =>
  			$el.classList.toggle("sa11y-label-visible")
  		);

  		// Close Settings panel when Show Outline is active.
  		$settingsPanel.classList.remove("sa11y-active");
  		$settingsToggle.classList.remove("sa11y-settings-active");
  		$settingsToggle.setAttribute("aria-expanded", "false");
  		$settingsToggle.textContent = `${Lang._("SHOW_SETTINGS")}`;

  		// Keyboard accessibility fix for scrollable panel content.
  		if ($outlineList.clientHeight > 250) {
  			$outlineList.setAttribute("tabindex", "0");
  		}
  	});

  	// Remember to leave outline open
  	if (localStorage.getItem("sa11y-remember-outline") === "Opened") {
  		$outlineToggle.classList.add("sa11y-outline-active");
  		$outlinePanel.classList.add("sa11y-active");
  		$outlineToggle.textContent = `${Lang._("HIDE_OUTLINE")}`;
  		$outlineToggle.setAttribute("aria-expanded", "true");
  		$headingAnnotations.forEach(($el) =>
  			$el.classList.toggle("sa11y-label-visible")
  		);
  		// Keyboard accessibility fix for scrollable panel content.
  		if ($outlineList.clientHeight > 250) {
  			$outlineList.setAttribute("tabindex", "0");
  			$outlineList.setAttribute("aria-label", `${Lang._("PAGE_OUTLINE")}`);
  			$outlineList.setAttribute("role", "region");
  		}
  	}

  	// Show settings panel
  	$settingsToggle.addEventListener("click", () => {
  		if ($settingsToggle.getAttribute("aria-expanded") === "true") {
  			$settingsToggle.classList.remove("sa11y-settings-active");
  			$settingsPanel.classList.remove("sa11y-active");
  			$settingsToggle.textContent = `${Lang._("SHOW_SETTINGS")}`;
  			$settingsToggle.setAttribute("aria-expanded", "false");
  		} else {
  			$settingsToggle.classList.add("sa11y-settings-active");
  			$settingsPanel.classList.add("sa11y-active");
  			$settingsToggle.textContent = `${Lang._("HIDE_SETTINGS")}`;
  			$settingsToggle.setAttribute("aria-expanded", "true");
  		}

  		// Set focus on Settings heading for accessibility.
  		document.querySelector("#sa11y-settings-header > h2").focus();

  		// Close Show Outline panel when Settings is active.
  		$outlinePanel.classList.remove("sa11y-active");
  		$outlineToggle.classList.remove("sa11y-outline-active");
  		$outlineToggle.setAttribute("aria-expanded", "false");
  		$outlineToggle.textContent = `${Lang._("SHOW_OUTLINE")}`;
  		$headingAnnotations.forEach(($el) =>
  			$el.classList.remove("sa11y-label-visible")
  		);
  		localStorage.setItem("sa11y-remember-outline", "Closed");

  		// Keyboard accessibility fix for scrollable panel content.
  		if ($settingsContent.clientHeight > 350) {
  			$settingsContent.setAttribute("tabindex", "0");
  			$settingsContent.setAttribute("aria-label", `${Lang._("SETTINGS")}`);
  			$settingsContent.setAttribute("role", "region");
  		}
  	});

  	// Enhanced keyboard accessibility for panel.
  	document
  		.getElementById("sa11y-panel-controls")
  		.addEventListener("keydown", (e) => {
  			const $tab = document.querySelectorAll(
  				"#sa11y-outline-toggle[role=tab], #sa11y-settings-toggle[role=tab]"
  			);
  			if (e.key === "ArrowRight") {
  				for (let i = 0; i < $tab.length; i++) {
  					if (
  						$tab[i].getAttribute("aria-expanded") === "true" ||
  						$tab[i].getAttribute("aria-expanded") === "false"
  					) {
  						$tab[i + 1].focus();
  						e.preventDefault();
  						break;
  					}
  				}
  			}
  			if (e.key === "ArrowDown") {
  				for (let i = 0; i < $tab.length; i++) {
  					if (
  						$tab[i].getAttribute("aria-expanded") === "true" ||
  						$tab[i].getAttribute("aria-expanded") === "false"
  					) {
  						$tab[i + 1].focus();
  						e.preventDefault();
  						break;
  					}
  				}
  			}
  			if (e.key === "ArrowLeft") {
  				for (let i = $tab.length - 1; i > 0; i--) {
  					if (
  						$tab[i].getAttribute("aria-expanded") === "true" ||
  						$tab[i].getAttribute("aria-expanded") === "false"
  					) {
  						$tab[i - 1].focus();
  						e.preventDefault();
  						break;
  					}
  				}
  			}
  			if (e.key === "ArrowUp") {
  				for (let i = $tab.length - 1; i > 0; i--) {
  					if (
  						$tab[i].getAttribute("aria-expanded") === "true" ||
  						$tab[i].getAttribute("aria-expanded") === "false"
  					) {
  						$tab[i - 1].focus();
  						e.preventDefault();
  						break;
  					}
  				}
  			}
  		});

  	const $closeAlertToggle = document.getElementById("sa11y-close-alert");
  	const $alertPanel = document.getElementById("sa11y-panel-alert");
  	const $alertText = document.getElementById("sa11y-panel-alert-text");
  	const $skipBtn = document.getElementById("sa11y-cycle-toggle");

  	$closeAlertToggle.addEventListener("click", () => {
  		$alertPanel.classList.remove("sa11y-active");
  		while ($alertText.firstChild) $alertText.removeChild($alertText.firstChild);
  		document
  			.querySelectorAll(".sa11y-pulse-border")
  			.forEach((el) => el.classList.remove("sa11y-pulse-border"));
  		$skipBtn.focus();
  	});
  }

  function skipToIssue() {
  	let reducedMotionQuery = false;
  	let scrollBehavior = "smooth";
  	if (!("scrollBehavior" in document.documentElement.style)) {
  		const js = document.createElement("script");
  		js.src =
  			"https://cdn.jsdelivr.net/npm/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js";
  		document.head.appendChild(js);
  	}
  	if (!document.documentMode) {
  		if (typeof window.matchMedia === "function") {
  			reducedMotionQuery = window.matchMedia(
  				"(prefers-reduced-motion: reduce)"
  			);
  		}
  		if (!reducedMotionQuery || reducedMotionQuery.matches) {
  			scrollBehavior = "auto";
  		}
  	}

  	// Constants
  	const $findButtons = document.querySelectorAll("[data-sa11y-annotation]");
  	const $alertPanel = document.getElementById("sa11y-panel-alert");
  	const $alertText = document.getElementById("sa11y-panel-alert-text");
  	const $alertPanelPreview = document.getElementById(
  		"sa11y-panel-alert-preview"
  	);
  	const $skipToggle = document.getElementById("sa11y-cycle-toggle");
  	const $closeAlertToggle = document.getElementById("sa11y-close-alert");
  	const findSa11yBtn = document.querySelectorAll(
  		"[data-sa11y-annotation]"
  	).length;

  	let i = -1;

  	// Add pulsing border to visible parent of hidden element.
  	const hiddenParent = () => {
  		$findButtons.forEach(($el) => {
  			const overflowing = findVisibleParent($el, "display", "none");
  			if (overflowing !== null) {
  				const hiddenparent = overflowing.previousElementSibling;
  				if (hiddenparent) {
  					hiddenparent.classList.add("sa11y-pulse-border");
  				} else {
  					overflowing.parentNode.classList.add("sa11y-pulse-border");
  				}
  			}
  		});
  	};

  	// Alert if tooltip is hidden.
  	const generateAlert = () => {
  		$alertPanel.classList.add("sa11y-active");
  		$alertText.textContent = `${Lang._("NOT_VISIBLE_ALERT")}`;
  		$alertPanelPreview.classList.add("sa11y-panel-alert-preview");
  		$alertPanelPreview.innerHTML =
  			$findButtons[i].getAttribute("data-tippy-content");
  		$closeAlertToggle.focus();
  	};

  	// Remove alert.
  	const removeAlert = () => {
  		$alertPanel.classList.remove("sa11y-active");
  		document
  			.querySelectorAll(".sa11y-pulse-border")
  			.forEach(($el) => $el.classList.remove("sa11y-pulse-border"));
  	};

  	// Find scroll position.
  	const scrollPosition = ($el) => {
  		const offsetTopPosition = $el.offsetTop;
  		if (offsetTopPosition === 0) {
  			const visiblePosition = findVisibleParent($el, "display", "none");
  			generateAlert();

  			if (visiblePosition) {
  				// Get as close to the hidden parent as possible.
  				const prevSibling = visiblePosition.previousElementSibling;
  				const { parentNode } = visiblePosition;
  				if (prevSibling) {
  					return offsetTop(prevSibling).top - 150;
  				}
  				return offsetTop(parentNode).top - 150;
  			}
  		}
  		removeAlert();
  		return offsetTop($el).top - 150;
  	};

  	// Skip to next.
  	const next = () => {
  		i += 1;
  		const $el = $findButtons[i];
  		const scrollPos = scrollPosition($el);
  		window.scrollTo({
  			top: scrollPos,
  			behavior: scrollBehavior,
  		});
  		if (i >= findSa11yBtn - 1) {
  			i = -1;
  		}
  		hiddenParent();
  		$el.focus();
  	};

  	// Skip to previous.
  	const prev = () => {
  		i = Math.max(0, (i -= 1));
  		const $el = $findButtons[i];
  		if ($el) {
  			const scrollPos = scrollPosition($el);
  			window.scrollTo({
  				top: scrollPos,
  				behavior: scrollBehavior,
  			});
  			hiddenParent();
  			$el.focus();
  		}
  	};

  	// Jump to issue using keyboard shortcut.
  	document.addEventListener("keyup", (e) => {
  		if (
  			findSa11yBtn &&
  			e.altKey &&
  			(e.code === "Period" || e.code === "KeyS")
  		) {
  			next();
  			e.preventDefault();
  		}
  	});

  	// Previous issue keyboard shortcut.
  	document.addEventListener("keyup", (e) => {
  		if (findSa11yBtn && e.altKey && (e.code === "Comma" || e.code === "KeyW")) {
  			prev();
  			e.preventDefault();
  		}
  	});

  	// Jump to issue using click.
  	$skipToggle.addEventListener("click", (e) => {
  		next();
  		e.preventDefault();
  	});
  }

  function updatePanel  ()  {
      setPanel(true);

      buildPanel();
      skipToIssue();

      const $skipBtn = document.getElementById('sa11y-cycle-toggle');
      $skipBtn.disabled = false;
      $skipBtn.setAttribute('style', 'cursor: pointer !important;');

      const $panel = document.getElementById('sa11y-panel');
      $panel.classList.add('sa11y-active');

      const html = document.querySelector('html');
      html.setAttribute('data-sa11y-active', 'true');

      const $panelContent = document.getElementById('sa11y-panel-content');
      const $status = document.getElementById('sa11y-status');
      const $findButtons = document.querySelectorAll('.sa11y-btn');

      if (errorCount > 0 && warningCount > 0) {
        $panelContent.setAttribute('class', 'sa11y-errors');
        $status.innerHTML = `${Lang._('ERRORS')} <span class="sa11y-panel-count sa11y-margin-right">${errorCount}</span> ${Lang._('WARNINGS')} <span class="sa11y-panel-count">${warningCount}</span>`;
      } else if (errorCount > 0) {
        $panelContent.setAttribute('class', 'sa11y-errors');
        $status.innerHTML = `${Lang._('ERRORS')} <span class="sa11y-panel-count">${errorCount}</span>`;
      } else if (warningCount > 0) {
        $panelContent.setAttribute('class', 'sa11y-warnings');
        $status.innerHTML = `${Lang._('WARNINGS')} <span class="sa11y-panel-count">${warningCount}</span>`;
      } else {
        $panelContent.setAttribute('class', 'sa11y-good');
        $status.textContent = `${Lang._('PANEL_STATUS_NONE')}`;

        if ($findButtons.length === 0) {
          $skipBtn.disabled = true;
          $skipBtn.setAttribute('style', 'cursor: default !important;');
        }
      }
    }

  function IssueGenerator(type, content, inline = false) {
  	let message = content;
  	const validTypes = [ERROR, WARNING, GOOD];

  	// TODO: Discuss Throwing Errors.
  	if (validTypes.indexOf(type) === -1) {
  		throw Error(`Invalid type [${type}] for annotation`);
  	}

  	const CSSName = {
  		[validTypes[0]]: "error",
  		[validTypes[1]]: "warning",
  		[validTypes[2]]: "good",
  	};

  	message = message
          .replaceAll(/<hr>/g, '<hr aria-hidden="true">')
          .replaceAll(/<a[\s]href=/g, '<a target="_blank" rel="noopener noreferrer" href=')
          .replaceAll(/<\/a>/g, `<span class="sa11y-visually-hidden"> (${Lang._('NEW_TAB')})</span></a>`)
          .replaceAll(/{r}/g, 'class="sa11y-red-text"');

        message = escapeHTML(message);

        return `<div class=${inline ? 'sa11y-instance-inline' : 'sa11y-instance'}>
                <button data-sa11y-annotation type="button" aria-label="${[type]}" class="sa11y-btn sa11y-${CSSName[type]}-btn${inline ? '-text' : ''}" data-tippy-content="<div lang='${Lang._('LANG_CODE')}'><div class='sa11y-header-text'>${[type]}</div>${message}</div>"></button>
              </div>`;
  }

  function annotateBanner (type, content)  {
  	let message = content;

  	const validTypes = [
  	  ERROR,
  	  WARNING,
  	  GOOD,
  	];

  	if (validTypes.indexOf(type) === -1) {
  	  throw Error(`Invalid type [${type}] for annotation`);
  	}

  	const CSSName = {
  	  [validTypes[0]]: 'error',
  	  [validTypes[1]]: 'warning',
  	  [validTypes[2]]: 'good',
  	};

  	// Check if content is a function & make translations easier.
  	if (message && {}.toString.call(message) === '[object Function]') {
  	  message = message
  		.replaceAll(/<hr>/g, '<hr aria-hidden="true">')
  		.replaceAll(/<a[\s]href=/g, '<a target="_blank" rel="noopener noreferrer" href=')
  		.replaceAll(/<\/a>/g, `<span class="sa11y-visually-hidden"> (${Lang._('NEW_TAB')})</span></a>`)
  		.replaceAll(/{r}/g, 'class="sa11y-red-text"');
  	  message = escapeHTML(message);
  	}

  	return `<div class="sa11y-instance sa11y-${CSSName[type]}-message-container"><div role="region" data-sa11y-annotation tabindex="-1" aria-label="${[type]}" class="sa11y-${CSSName[type]}-message" lang="${Lang._('LANG_CODE')}">${message}</div></div>`;
    }

  // checkHeaders(headings,ignoreClasses)


  function checkHeaders( h, h1) {
  	let prevLevel;

  	// For each heading on the page
  	h.forEach(function ($el, i) {
  		const text = computeTextNodeWithImage($el);
  		const htext = sanitizeForHTML(text);
  		let level;

  		// Get the level of the current heading
  		if ($el.getAttribute("aria-level")) {
  			level = +$el.getAttribute("aria-level");
  		} else {
  			level = +$el.tagName.slice(1);
  		}

  		// Get heading length
  		const headingLength = $el.textContent.trim().length;
  		let error = null;
  		let warning = null;

  		// If the heading is non consequtive based on it's heading level
  		if (level - prevLevel > 1 && i !== 0) {
  			{
  				error = Lang.sprintf("HEADING_NON_CONSECUTIVE_LEVEL", prevLevel, level);
  			}
  		} else if ($el.textContent.trim().length === 0) {
  			if ($el.querySelectorAll("img").length) {
  				const imgalt = $el.querySelector("img").getAttribute("alt");
  				if (imgalt === null || imgalt === " " || imgalt === "") {
  					error = Lang.sprintf("HEADING_EMPTY_WITH_IMAGE", level);
  					$el.classList.add("sa11y-error-text");
  				}
  			} else {
  				error = Lang.sprintf("HEADING_EMPTY", level);
  				$el.classList.add("sa11y-error-text");
  			}
  		} else if (i === 0 && level !== 1 && level !== 2) {
  			error = Lang._("HEADING_FIRST");
  		} else if (
  			$el.textContent.trim().length > 170 &&
  			option.flagLongHeadings === true
  		) {
  			warning = Lang.sprintf("HEADING_LONG", headingLength);
  		}

  		prevLevel = level;

  		const li = `<li class='sa11y-outline-${level}'>
		<span class='sa11y-badge'>${level}</span>
		<span class='sa11y-outline-list-item'>${htext}</span>
	</li>`;

  		const liError = `<li class='sa11y-outline-${level}'>
		<span class='sa11y-badge sa11y-error-badge'>
		<span aria-hidden='true'>&#10007;</span>
		<span class='sa11y-visually-hidden'>${Lang._("ERROR")}</span> ${level}</span>
		<span class='sa11y-outline-list-item sa11y-red-text sa11y-bold'>${htext}</span>
	</li>`;

  		const liWarning = `<li class='sa11y-outline-${level}'>
		<span class='sa11y-badge sa11y-warning-badge'>
		<span aria-hidden='true'>&#x3f;</span>
		<span class='sa11y-visually-hidden'>${Lang._("WARNING")}</span> ${level}</span>
		<span class='sa11y-outline-list-item sa11y-yellow-text sa11y-bold'>${htext}</span>
	</li>`;

  		// Add the heading to the outline (wrt error/pass)
  		let ignoreArray = [];
  		if (!ignoreArray.includes($el)) {
  			// Append heading labels.
  			$el.insertAdjacentHTML(
  				"beforeend",
  				`<span class='sa11y-heading-label'>H${level}</span>`
  			);

  			// Heading errors
  			if (error !== null && $el.closest("a") !== null) {
  				setError(errorCount+1);
  				$el.classList.add("sa11y-error-border");
  				$el.closest('a').insertAdjacentHTML('afterend', IssueGenerator(ERROR, error, true));
  				document
  					.querySelector("#sa11y-outline-list")
  					.insertAdjacentHTML("beforeend", liError);
  			} else if (error !== null) {
  				setError(errorCount+1);
  				$el.classList.add("sa11y-error-border");
  				$el.insertAdjacentHTML('beforebegin', IssueGenerator(ERROR, error));
  				document
  					.querySelector("#sa11y-outline-list")
  					.insertAdjacentHTML("beforeend", liError);
  			} else if (warning !== null && $el.closest("a") !== null) {
  				setWarning(warningCount+1);
  				$el.classList.add("sa11y-warning-border");
  				$el.closest('a').insertAdjacentHTML('afterend', IssueGenerator(WARNING, warning));
  				document
  					.querySelector("#sa11y-outline-list")
  					.insertAdjacentHTML("beforeend", liWarning);
  			} else if (warning !== null) {
  				setWarning(warningCount+1);
  				$el.classList.add("sa11y-warning-border");
  				$el.insertAdjacentHTML('beforebegin', IssueGenerator(WARNING, warning));
  				document
  					.querySelector("#sa11y-outline-list")
  					.insertAdjacentHTML("beforeend", liWarning);
  			} else if (error === null || warning === null) {
  				document
  					.querySelector("#sa11y-outline-list")
  					.insertAdjacentHTML("beforeend", li);
  			}
  		}
  	});
  	// Check to see there is at least one H1 on the page.
  	if (h1.length === 0) {
          const updateH1Outline = `<div class='sa11y-instance sa11y-missing-h1'>
                    <span class='sa11y-badge sa11y-error-badge'><span aria-hidden='true'>&#10007;</span><span class='sa11y-visually-hidden'>${Lang._('ERROR')}</span></span>
                    <span class='sa11y-red-text sa11y-bold'>${Lang._('PANEL_HEADING_MISSING_ONE')}</span>
                </div>`;
          document.getElementById('sa11y-outline-header').insertAdjacentHTML('afterend', updateH1Outline);
  		setError(errorCount+1);
          document.getElementById('sa11y-container').insertAdjacentHTML('afterend', annotateBanner(ERROR, Lang._('HEADING_MISSING_ONE')));
        }
  }

  function checkLinkText (link)  {
    const containsLinkTextStopWords = (textContent) => {
      const urlText = [
        'http',
        '.asp',
        '.htm',
        '.php',
        '.edu/',
        '.com/',
        '.net/',
        '.org/',
        '.us/',
        '.ca/',
        '.de/',
        '.icu/',
        '.uk/',
        '.ru/',
        '.info/',
        '.top/',
        '.xyz/',
        '.tk/',
        '.cn/',
        '.ga/',
        '.cf/',
        '.nl/',
        '.io/',
        '.fr/',
        '.pe/',
        '.nz/',
        '.pt/',
        '.es/',
        '.pl/',
        '.ua/',
      ];

      const hit = [null, null, null];

      // Flag partial stop words.
      Lang._('PARTIAL_ALT_STOPWORDS').forEach((word) => {
        if (
          textContent.length === word.length && textContent.toLowerCase().indexOf(word) >= 0
        ) {
          hit[0] = word;
        }
        return false;
      });

      // Other warnings we want to add.
      Lang._('WARNING_ALT_STOPWORDS').forEach((word) => {
        if (textContent.
          toLowerCase().indexOf(word) >= 0) {
          hit[1] = word;
        }
        return false;
      });

      // Flag link text containing URLs.
      urlText.forEach((word) => {
        if (textContent.toLowerCase().indexOf(word) >= 0) {
          hit[2] = word;
        }
        return false;
      });
      return hit;
    };

    link.forEach((el) => {
      let linkText = computeAriaLabel(el);
      const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
      const hasAriaLabel = el.getAttribute('aria-label');
      let childAriaLabelledBy = null;
      let childAriaLabel = null;
      const hasTitle = el.getAttribute('title');

      if (el.children.length) {
        const $firstChild = el.children[0];
        childAriaLabelledBy = $firstChild.getAttribute('aria-labelledby');
        childAriaLabel = $firstChild.getAttribute('aria-label');
      }

      if (linkText === 'noAria') {
        // Plain text content.
        linkText = el.textContent.trim();
        const $img = el.querySelector('img');

        // If an image exists within the link. Help with AccName computation.
        if ($img) {
          // Check if there's aria on the image.
          const imgText = computeAriaLabel($img);
          if (imgText !== 'noAria') {
            linkText += imgText;
          } else {
            // No aria? Process alt on image.
            linkText += $img ? ($img.getAttribute('alt') || '') : '';
          }
        }
      }

      const linkTextTrimmed = linkText.replace(/\s+/g, ' ').trim();
      const error = containsLinkTextStopWords(fnIgnore(el, option.linkIgnoreSpan).textContent.replace(/[!*?↣↳→↓»↴]/g, '').trim());

      if (el.querySelectorAll('img').length) ; else if (el.getAttribute('href') && !linkTextTrimmed) {
        // Flag empty hyperlinks.
        if (el && hasTitle) ; else if (el.children.length) {
          // Has child elements (e.g. SVG or SPAN) <a><i></i></a>
          setError(errorCount+1);
          el.classList.add('sa11y-error-border');
          el.insertAdjacentHTML('afterend', IssueGenerator(ERROR, Lang._('LINK_EMPTY_LINK_NO_LABEL'), true));
        } else {
          // Completely empty <a></a>
          setError(errorCount+1);
          el.classList.add('sa11y-error-border');
          el.insertAdjacentHTML('afterend', IssueGenerator(ERROR, Lang._('LINK_EMPTY'), true));
        }
      } else if (error[0] != null) {
        // Contains stop words.
        if (hasAriaLabelledBy || hasAriaLabel || childAriaLabelledBy || childAriaLabel) {
          {
            el.insertAdjacentHTML(
              'beforebegin',
              IssueGenerator(GOOD, Lang.sprintf('LINK_LABEL', linkText), true),
            );
          }
        } else if (el.getAttribute('aria-hidden') === 'true' && el.getAttribute('tabindex') === '-1') ; else {
          el.classList.add('sa11y-error-text');
          setError(errorCount+1);
          el.insertAdjacentHTML(
            'afterend',
            IssueGenerator(ERROR, Lang.sprintf('LINK_STOPWORD', error[0]), true),
          );
        }
      } else if (error[1] != null) {
        // Contains warning words.
        el.classList.add('sa11y-warning-text');
        setWarning(warningCount+1);
        el.insertAdjacentHTML(
          'afterend',
          IssueGenerator(WARNING, Lang.sprintf('LINK_BEST_PRACTICES', error[1]), true),
        );
      } else if (error[2] != null) {
        // Contains URL in link text.
        if (linkText.length > 40) {
          el.classList.add('sa11y-warning-text');
          setWarning(warningCount+1);
          el.insertAdjacentHTML('afterend', IssueGenerator(WARNING, Lang._('LINK_URL'), true));
        }
      } else if (hasAriaLabelledBy || hasAriaLabel || childAriaLabelledBy || childAriaLabel) {
        // If the link has any ARIA, append a "Good" link button.
        {
          el.insertAdjacentHTML(
            'beforebegin',
            IssueGenerator(GOOD, Lang.sprintf('LINK_LABEL', linkText), true),
          );
        }
      }
    });
  }

  function checkAltText( images ) {
  	let containsAltTextStopWords = (alt) => {
  		const altUrl = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".tiff", ".svg"];

  		const hit = [null, null, null];
  		altUrl.forEach((word) => {
  			if (alt.toLowerCase().indexOf(word) >= 0) {
  				hit[0] = word;
  			}
  		});
  		Lang._("SUSPICIOUS_ALT_STOPWORDS").forEach((word) => {
  			if (alt.toLowerCase().indexOf(word) >= 0) {
  				hit[1] = word;
  			}
  		});
  		Lang._("PLACEHOLDER_ALT_STOPWORDS").forEach((word) => {
  			if (alt.length === word.length && alt.toLowerCase().indexOf(word) >= 0) {
  				hit[2] = word;
  			}
  		});
  		return hit;
  	};

  	images.forEach(function ($el, i) {
  		const alt = $el.getAttribute("alt");
  		if (alt === null) {
  			if ($el.closest("a[href]")) {
  				if (
  					fnIgnore($el.closest("a[href]"), "noscript").textContent.trim()
  						.length >= 1
  				) {
  					setError(errorCount+1);
  					$el.classList.add("sa11y-error-border");
  					$el
  						.closest("a[href]")
  						.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(
  								ERROR,
  								Lang._("MISSING_ALT_LINK_BUT_HAS_TEXT_MESSAGE")
  							)
  						);
  				} else if (
  					fnIgnore($el.closest("a[href]"), "noscript").textContent.trim()
  						.length === 0
  				) {
  					$el.classList.add("sa11y-error-border");
  					setError(errorCount+1);
  					$el
  						.closest("a[href]")
  						.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(ERROR, Lang._("MISSING_ALT_LINK_MESSAGE"))
  						);
  				}
  			} else {
  				// General failure message if image is missing alt.
  				$el.classList.add("sa11y-error-border");
  				setError(errorCount+1);
  				$el.insertAdjacentHTML(
  					"beforebegin",
  					IssueGenerator(ERROR, Lang._("MISSING_ALT_MESSAGE"))
  				);
  			}
  		} else {
  			// If alt attribute is present, further tests are done.
  			const altText = sanitizeForHTML(alt); // Prevent tooltip from breaking.
  			const error = containsAltTextStopWords(altText);
  			const altLength = alt.length;

  			// Image fails if a stop word was found.
  			if (error[0] !== null && $el.closest("a[href]")) {
  				
  				$el.classList.add("sa11y-error-border");
  				setError(errorCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							ERROR,
  							Lang.sprintf("LINK_IMAGE_BAD_ALT_MESSAGE", error[0], altText)
  						)
  					);
  			} else if (error[2] !== null && $el.closest("a[href]")) {
  				$el.classList.add("sa11y-error-border");
  				setError(errorCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							ERROR,
  							Lang.sprintf("LINK_IMAGE_PLACEHOLDER_ALT_MESSAGE", altText)
  						)
  					);
  			} else if (error[1] !== null && $el.closest("a[href]")) {
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							WARNING,
  							Lang.sprintf("LINK_IMAGE_SUS_ALT_MESSAGE", error[1], altText)
  						)
  					);
  			} else if (error[0] !== null) {
  				$el.classList.add("sa11y-error-border");
  				setError(errorCount+1);
  				$el.insertAdjacentHTML(
  					"beforebegin",
  					IssueGenerator(
  						ERROR,
  						Lang.sprintf("LINK_ALT_HAS_BAD_WORD_MESSAGE", altText, error[0])
  					)
  				);
  			} else if (error[2] !== null) {
  				$el.classList.add("sa11y-error-border");
  				setError(errorCount+1);
  				$el.insertAdjacentHTML(
  					"beforebegin",
  					IssueGenerator(ERROR, Lang.sprintf("ALT_PLACEHOLDER_MESSAGE", altText))
  				);
  			} else if (error[1] !== null) {
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el.insertAdjacentHTML(
  					"beforebegin",
  					IssueGenerator(
  						WARNING,
  						Lang.sprintf("ALT_HAS_SUS_WORD", error[1], altText)
  					)
  				);
  			} else if ((alt === "" || alt === " ") && $el.closest("a[href]")) {
  				if (
  					$el.closest("a[href]").getAttribute("tabindex") === "-1" &&
  					$el.closest("a[href]").getAttribute("aria-hidden") === "true"
  				) ; else if (
  					$el.closest("a[href]").getAttribute("aria-hidden") === "true"
  				) {
  					$el.classList.add("sa11y-error-border");
  					setError(errorCount+1);
  					$el
  						.closest("a[href]")
  						.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(ERROR, Lang._("LINK_IMAGE_ARIA_HIDDEN"))
  						);
  				} else if (
  					fnIgnore($el.closest("a[href]"), "noscript").textContent.trim()
  						.length === 0
  				) {
  					$el.classList.add("sa11y-error-border");
  					setError(errorCount+1);
  					$el
  						.closest("a[href]")
  						.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(ERROR, Lang._("LINK_IMAGE_NO_ALT_TEXT"))
  						);
  				} else {
  					$el
  						.closest("a[href]")
  						.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(GOOD, Lang._("LINK_IMAGE_HAS_TEXT"))
  						);
  				}
  			} else if (alt.length > 250 && $el.closest("a[href]")) {
  				// Link and contains alt text.
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							WARNING,
  							Lang.sprintf("LINK_IMAGE_LONG_ALT", altLength, altText)
  						)
  					);
  			} else if (
  				alt !== "" &&
  				$el.closest("a[href]") &&
  				fnIgnore($el.closest("a[href]"), "noscript").textContent.trim()
  					.length === 0
  			) {
  				// Link and contains an alt text.
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							WARNING,
  							Lang.sprintf("LINK_IMAGE_ALT_WARNING", altText)
  						)
  					);
  			} else if (
  				alt !== "" &&
  				$el.closest("a[href]") &&
  				fnIgnore($el.closest("a[href]"), "noscript").textContent.trim()
  					.length >= 1
  			) {
  				// Contains alt text & surrounding link text.
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el
  					.closest("a[href]")
  					.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(
  							WARNING,
  							Lang.sprintf("LINK_IMAGE_ALT_AND_TEXT_WARNING", altText)
  						)
  					);
  			} else if (alt === "" || alt === " ") {
  				// Decorative alt and not a link.
  				if ($el.closest("figure")) {
  					const figcaption = $el.closest("figure").querySelector("figcaption");
  					if (
  						figcaption !== null &&
  						figcaption.textContent.trim().length >= 1
  					) {
  						$el.classList.add("sa11y-warning-border");
  						setWarning(warningCount+1);
  						$el.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(WARNING, Lang._("IMAGE_FIGURE_DECORATIVE"))
  						);
  					}
  				} else {
  					$el.classList.add("sa11y-warning-border");
  					setWarning(warningCount+1);
  					$el.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(WARNING, Lang._("IMAGE_DECORATIVE"))
  					);
  				}
  			} else if (alt.length > 250) {
  				$el.classList.add("sa11y-warning-border");
  				setWarning(warningCount+1);
  				$el.insertAdjacentHTML(
  					"beforebegin",
  					IssueGenerator(
  						WARNING,
  						Lang.sprintf("IMAGE_ALT_TOO_LONG", altLength, altText)
  					)
  				);
  			} else if (alt !== "") {
  				// Figure element has same alt and caption text.
  				if ($el.closest("figure")) {
  					const figcaption = $el.closest("figure").querySelector("figcaption");
  					if (
  						!!figcaption &&
  						figcaption.textContent.trim().toLowerCase() ===
  							altText.trim().toLowerCase()
  					) {
  						$el.classList.add("sa11y-warning-border");
  						setWarning(warningCount+1);
  						$el.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(
  								WARNING,
  								Lang.sprintf("IMAGE_FIGURE_DUPLICATE_ALT", altText)
  							)
  						);
  					} else {
  						$el.insertAdjacentHTML(
  							"beforebegin",
  							IssueGenerator(GOOD, Lang.sprintf("IMAGE_PASS", altText))
  						);
  					}
  				} else {
  					// If image has alt text - pass!
  					$el.insertAdjacentHTML(
  						"beforebegin",
  						IssueGenerator(GOOD, Lang.sprintf("IMAGE_PASS", altText))
  					);
  				}
  			}
  		}
  	});
  }

  function checkContrast($contrast) {
  	let contrastErrors = {
  		errors: [],
  		warnings: [],
  	};

  	const elements = $contrast;
  	const contrast = {
  		// Parse rgb(r, g, b) and rgba(r, g, b, a) strings into an array.
  		// Adapted from https://github.com/gka/chroma.js
  		parseRgb(css) {
  			let i;
  			let m;
  			let rgb;
  			let f;
  			let k;
  			// eslint-disable-next-line no-useless-escape
  			if ((m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/))) {
  				rgb = m.slice(1, 4);
  				for (i = f = 0; f <= 2; i = ++f) {
  					rgb[i] = +rgb[i];
  				}
  				rgb[3] = 1;
  				// eslint-disable-next-line no-useless-escape
  			} else if (
  				(m = css.match(
  					/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/
  				))
  			) {
  				rgb = m.slice(1, 5);
  				for (i = k = 0; k <= 3; i = ++k) {
  					rgb[i] = +rgb[i];
  				}
  			}
  			return rgb;
  		},
  		// Based on http://www.w3.org/TR/WCAG20/#relativeluminancedef
  		relativeLuminance(c) {
  			const lum = [];
  			for (let i = 0; i < 3; i++) {
  				const v = c[i] / 255;
  				// eslint-disable-next-line no-restricted-properties
  				lum.push(v < 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  			}
  			return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
  		},
  		// Based on http://www.w3.org/TR/WCAG20/#contrast-ratiodef
  		contrastRatio(x, y) {
  			const l1 = contrast.relativeLuminance(contrast.parseRgb(x));
  			const l2 = contrast.relativeLuminance(contrast.parseRgb(y));
  			return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  		},

  		getBackground(el) {
  			const styles = getComputedStyle(el);
  			const bgColor = styles.backgroundColor;
  			const bgImage = styles.backgroundImage;
  			const rgb = `${contrast.parseRgb(bgColor)}`;
  			const alpha = rgb.split(",");

  			// if background has alpha transparency, flag manual check
  			if (alpha[3] < 1 && alpha[3] > 0) {
  				return "alpha";
  			}

  			// if element has no background image, or transparent return bgColor
  			if (
  				bgColor !== "rgba(0, 0, 0, 0)" &&
  				bgColor !== "transparent" &&
  				bgImage === "none" &&
  				alpha[3] !== "0"
  			) {
  				return bgColor;
  			}
  			if (bgImage !== "none") {
  				return "image";
  			}

  			// retest if not returned above
  			if (el.tagName === "HTML") {
  				return "rgb(255, 255, 255)";
  			}
  			return contrast.getBackground(el.parentNode);
  		},
  		check() {
  			// resets results
  			contrastErrors = {
  				errors: [],
  				warnings: [],
  			};

  			for (let i = 0; i < elements.length; i++) {
  				const elem = elements[i];
  				if (contrast) {
  					const style = getComputedStyle(elem);
  					const { color } = style;
  					const { fill } = style;
  					const fontSize = parseInt(style.fontSize, 10);
  					const pointSize = fontSize * (3 / 4);
  					const { fontWeight } = style;
  					const htmlTag = elem.tagName;
  					const background = contrast.getBackground(elem);
  					const textString = [].reduce.call(
  						elem.childNodes,
  						(a, b) => a + (b.nodeType === 3 ? b.textContent : ""),
  						""
  					);
  					const text = textString.trim();
  					let ratio;
  					let error;
  					let warning;

  					if (htmlTag === "SVG") {
  						ratio =
  							Math.round(contrast.contrastRatio(fill, background) * 100) / 100;
  						if (ratio < 3) {
  							error = {
  								elem,
  								ratio: `${ratio}:1`,
  							};
  							contrastErrors.errors.push(error);
  						}
  					} else if (
  						text.length ||
  						htmlTag === "INPUT" ||
  						htmlTag === "SELECT" ||
  						htmlTag === "TEXTAREA"
  					) {
  						// does element have a background image - needs to be manually reviewed
  						if (background === "image") {
  							warning = {
  								elem,
  							};
  							contrastErrors.warnings.push(warning);
  						} else if (background === "alpha") {
  							warning = {
  								elem,
  							};
  							contrastErrors.warnings.push(warning);
  						} else {
  							ratio =
  								Math.round(contrast.contrastRatio(color, background) * 100) /
  								100;
  							if (pointSize >= 18 || (pointSize >= 14 && fontWeight >= 700)) {
  								if (ratio < 3) {
  									error = {
  										elem,
  										ratio: `${ratio}:1`,
  									};
  									contrastErrors.errors.push(error);
  								}
  							} else if (ratio < 4.5) {
  								error = {
  									elem,
  									ratio: `${ratio}:1`,
  								};
  								contrastErrors.errors.push(error);
  							}
  						}
  					}
  				}
  			}
  			return contrastErrors;
  		},
  	};

  	contrast.check();

  	contrastErrors.errors.forEach((item) => {
  		const name = item.elem;
  		const cratio = item.ratio;
  		const clone = name.cloneNode(true);
  		const removeSa11yHeadingLabel = clone.querySelectorAll(
  			".sa11y-heading-label"
  		);
  		for (let i = 0; i < removeSa11yHeadingLabel.length; i++) {
  			clone.removeChild(removeSa11yHeadingLabel[i]);
  		}

  		const nodetext = fnIgnore(clone, "script").textContent;
  		if (name.tagName === "INPUT") {
  			setError(errorCount + 1);
  			name.insertAdjacentHTML(
  				"beforebegin",
  				IssueGenerator(ERROR, Lang.sprintf("CONTRAST_INPUT_ERROR", cratio))
  			);
  		} else {
  			setError(errorCount + 1);
  			name.insertAdjacentHTML(
  				"beforebegin",
  				IssueGenerator(ERROR, Lang.sprintf("CONTRAST_ERROR", cratio, nodetext))
  			);
  		}
  	});

  	contrastErrors.warnings.forEach((item) => {
  		const name = item.elem;
  		const clone = name.cloneNode(true);
  		const removeSa11yHeadingLabel = clone.querySelectorAll(
  			".sa11y-heading-label"
  		);
  		for (let i = 0; i < removeSa11yHeadingLabel.length; i++) {
  			clone.removeChild(removeSa11yHeadingLabel[i]);
  		}
  		const nodetext = fnIgnore(clone, "script").textContent;
  		setWarning(warningCount + 1);
  		name.insertAdjacentHTML(
  			"beforebegin",
  			IssueGenerator(WARNING, Lang.sprintf("CONTRAST_WARNING", nodetext))
  		);
  	});
  }

  document.getElementsByTagName("html")[0].getAttribute("lang");
  function checkReadability({ readability }, elemToIgnore) {
  	//Crude hack to add a period to the end of list items to make a complete sentence.
  	readability.forEach(($el) => {
  		const listText = $el.textContent;
  		if (listText.length >= 120) {
  			if (listText.charAt(listText.length - 1) !== ".") {
  				$el.insertAdjacentHTML(
  					"beforeend",
  					"<span class='sa11y-readability-period sa11y-visually-hidden'>.</span>"
  				);
  			}
  		}
  	});

  	const numberOfSyllables = (el) => {
  		let wordCheck = el;
  		wordCheck = wordCheck.toLowerCase().replace(".", "").replace("\n", "");
  		if (wordCheck.length <= 3) {
  			return 1;
  		}
  		wordCheck = wordCheck.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  		wordCheck = wordCheck.replace(/^y/, "");
  		const syllableString = wordCheck.match(/[aeiouy]{1,2}/g);
  		let syllables = 0;

  		const syllString = !!syllableString;
  		if (syllString) {
  			syllables = syllableString.length;
  		}

  		return syllables;
  	};

  	const readabilityarray = [];
  	for (let i = 0; i < readability.length; i++) {
  		const current = readability[i];
  		if (current.textContent.replace(/ |\n/g, "") !== "") {
  			readabilityarray.push(current.textContent);
  		}
  	}

  	const paragraphtext = readabilityarray.join(" ").trim().toString();
  	const wordsRaw = paragraphtext.replace(/[.!?-]+/g, " ").split(" ");
  	let words = 0;
  	for (let i = 0; i < wordsRaw.length; i++) {
  		// eslint-disable-next-line eqeqeq
  		if (wordsRaw[i] != 0) {
  			words += 1;
  		}
  	}

  	const sentenceRaw = paragraphtext.split(/[.!?]+/);
  	let sentences = 0;
  	for (let i = 0; i < sentenceRaw.length; i++) {
  	  if (sentenceRaw[i] !== '') {
  		sentences += 1;
  	  }
  	}

  	let totalSyllables = 0;
  	let syllables1 = 0;
  	let syllables2 = 0;
  	for (let i = 0; i < wordsRaw.length; i++) {
  		// eslint-disable-next-line eqeqeq
  		if (wordsRaw[i] != 0) {
  			const syllableCount = numberOfSyllables(wordsRaw[i]);
  			if (syllableCount === 1) {
  				syllables1 += 1;
  			}
  			if (syllableCount === 2) {
  				syllables2 += 1;
  			}
  			totalSyllables += syllableCount;
  		}
  	}

  	let flesch;
  	{
  		flesch =
  			206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words);
  	}

  	if (flesch > 100) {
  		flesch = 100;
  	} else if (flesch < 0) {
  		flesch = 0;
  	}

  	const $readabilityinfo = document.getElementById("sa11y-readability-info");

  	if (paragraphtext.length === 0) {
  		$readabilityinfo.innerHTML = Lang._("READABILITY_NO_P_OR_LI_MESSAGE");
  	} else if (words > 30) {
  		const fleschScore = flesch.toFixed(1);
  		const avgWordsPerSentence = (words / sentences).toFixed(1);
  		const complexWords = Math.round(
  			100 * ((words - (syllables1 + syllables2)) / words)
  		);

  		// WCAG AAA pass if greater than 60
  		if (fleschScore >= 0 && fleschScore < 30) {
  			$readabilityinfo.innerHTML = `<span>${fleschScore}</span> <span class="sa11y-readability-score">${Lang._(
				"LANG_VERY_DIFFICULT"
			)}</span>`;
  		} else if (fleschScore > 31 && fleschScore < 49) {
  			$readabilityinfo.innerHTML = `<span>${fleschScore}</span> <span class="sa11y-readability-score">${Lang._(
				"LANG_DIFFICULT"
			)}</span>`;
  		} else if (fleschScore > 50 && fleschScore < 60) {
  			$readabilityinfo.innerHTML = `<span>${fleschScore}</span> <span class="sa11y-readability-score">${Lang._(
				"LANG_FAIRLY_DIFFICULT"
			)}</span>`;
  		} else {
  			$readabilityinfo.innerHTML = `<span>${fleschScore}</span> <span class="sa11y-readability-score">${Lang._(
				"LANG_GOOD"
			)}</span>`;
  		}

  		document.getElementById("sa11y-readability-details").innerHTML = `<li>
        <span class='sa11y-bold'>${Lang._(
					"LANG_AVG_SENTENCE"
				)}</span> ${avgWordsPerSentence}</li>
        <li><span class='sa11y-bold'>${Lang._(
					"LANG_COMPLEX_WORDS"
				)}</span> ${complexWords}%</li>
        <li><span class='sa11y-bold'>${Lang._(
					"LANG_TOTAL_WORDS"
				)}</span> ${words}</li>`;
  	} else {
  		$readabilityinfo.textContent = Lang._(
  			"READABILITY_NOT_ENOUGH_CONTENT_MESSAGE"
  		);
  	}
  }

  function initializeTooltips() {
  	tippy(".sa11y-btn", {
  		interactive: true,
  		trigger: "mouseenter click focusin", // Focusin trigger to ensure "Jump to issue" button displays tooltip.
  		arrow: true,
  		delay: [200, 0], // Slight delay to ensure mouse doesn't quickly trigger and hide tooltip.
  		theme: "sa11y-theme",
  		placement: "auto-start",
  		allowHTML: true,
  		aria: {
  			content: "describedby",
  		},
  		appendTo: document.body,
  	});
  }

  async function checkAll() {
  	setError(0);
  	setWarning(0);
  	// Error handling. If specified selector doesn't exist on page.
  	const rootTarget = document.querySelector(option.checkRoot);
  	if (!rootTarget) {
          // If target root can't be found, scan the body of page instead.
          var root = document.querySelector("body");

          // Send an alert to panel.
          const $alertPanel = document.getElementById("sa11y-panel-alert");
          const $alertText = document.getElementById("sa11y-panel-alert-text");

          root = option.checkRoot;
          $alertText.innerHTML = `${Lang.sprintf("ERROR_MISSING_ROOT_TARGET", root)}`;
          $alertPanel.classList.add("sa11y-active");
      } else {
          var root = document.querySelector(option.checkRoot);
      }

  	let elem=findElements();

  	// Ruleset checks
  	checkHeaders(elem["h"], elem["h1"]);
  	checkLinkText(elem["link"]);
  	checkAltText(elem["images"]);

  	// Contrast plugin
  	{
  		if (localStorage.getItem("sa11y-remember-contrast") === "On") {
  			checkContrast(elem["$contrast"]);
  		}
  	}

  	// // Form labels plugin
  	// if (option.formLabelsPlugin === true) {
  	// 	if (localStorage.getItem("sa11y-remember-labels") === "On") {
  	// 		// checkLabels();
  	// 	}
  	// } else {
  	// 	const formLabelsLi = document.getElementById("sa11y-form-labels-li");
  	// 	formLabelsLi.setAttribute("style", "display: none !important;");
  	// 	localStorage.setItem("sa11y-remember-labels", "Off");
  	// }

  	// // Links (Advanced) plugin
  	// if (option.linksAdvancedPlugin === true) {
  	// 	if (localStorage.getItem("sa11y-remember-links-advanced") === "On") {
  	// 		// checkLinksAdvanced();
  	// 	}
  	// } else {
  	// 	const linksAdvancedLi = document.getElementById("sa11y-links-advanced-li");
  	// 	linksAdvancedLi.setAttribute("style", "display: none !important;");
  	// 	localStorage.setItem("sa11y-remember-links-advanced", "Off");
  	// }

  	// Readability plugin
  	{
  		if (localStorage.getItem("sa11y-remember-readability") === "On") {
  			checkReadability(elem);
  		}
  	}

  	// // Embedded content plugin
  	// if (option.embeddedContentAll === true) {
  	// 	// checkEmbeddedContent();
  	// }

  	// // QA module checks.
  	// // checkQA();

  	// // Custom checks abstracted to seperate class.
  	// if (option.customChecks && option.customChecks.setSa11y) {
  	// 	option.customChecks.check();
  	// }

  	// Update panel
  	if (panelActive) {
  		resetAll();
  	} else {
  		updatePanel();
  	}
  	initializeTooltips();
  	detectOverflow();
  	nudge();

  	// Don't show badge when panel is opened.
  	if (!document.getElementsByClassName("sa11y-on").length) {
  		updateBadge();
  	}
  }

  function settingPanelToggles() {
  	// Toggle: Contrast
  	const $contrastToggle = document.getElementById("sa11y-contrast-toggle");
  	$contrastToggle.onclick = async () => {
  		if (localStorage.getItem("sa11y-remember-contrast") === "On") {
  			localStorage.setItem("sa11y-remember-contrast", "Off");
  			$contrastToggle.textContent = `${Lang._("OFF")}`;
  			$contrastToggle.setAttribute("aria-pressed", "false");
  			resetAll(false);
  			checkAll();
  		} else {
  			localStorage.setItem("sa11y-remember-contrast", "On");
  			$contrastToggle.textContent = `${Lang._("ON")}`;
  			$contrastToggle.setAttribute("aria-pressed", "true");
  			resetAll(false);
  			checkAll();
  		}
  	};

  	// Toggle: Form labels
  	const $labelsToggle = document.getElementById("sa11y-labels-toggle");
  	$labelsToggle.onclick = async () => {
  		if (localStorage.getItem("sa11y-remember-labels") === "On") {
  			localStorage.setItem("sa11y-remember-labels", "Off");
  			$labelsToggle.textContent = `${Lang._("OFF")}`;
  			$labelsToggle.setAttribute("aria-pressed", "false");
  			resetAll(false);
  			await checkAll();
  		} else {
  			localStorage.setItem("sa11y-remember-labels", "On");
  			$labelsToggle.textContent = `${Lang._("ON")}`;
  			$labelsToggle.setAttribute("aria-pressed", "true");
  			resetAll(false);
  			await checkAll();
  		}
  	};

  	// Toggle: Links (Advanced)
  	const $linksToggle = document.getElementById("sa11y-links-advanced-toggle");
  	$linksToggle.onclick = async () => {
  		if (localStorage.getItem("sa11y-remember-links-advanced") === "On") {
  			localStorage.setItem("sa11y-remember-links-advanced", "Off");
  			$linksToggle.textContent = `${Lang._("OFF")}`;
  			$linksToggle.setAttribute("aria-pressed", "false");
  			resetAll(false);
  			await checkAll();
  		} else {
  			localStorage.setItem("sa11y-remember-links-advanced", "On");
  			$linksToggle.textContent = `${Lang._("ON")}`;
  			$linksToggle.setAttribute("aria-pressed", "true");
  			resetAll(false);
  			await checkAll();
  		}
  	};

  	// Toggle: Readability
  	const $readabilityToggle = document.getElementById(
  		"sa11y-readability-toggle"
  	);
  	$readabilityToggle.onclick = async () => {
  		if (localStorage.getItem("sa11y-remember-readability") === "On") {
  			localStorage.setItem("sa11y-remember-readability", "Off");
  			$readabilityToggle.textContent = `${Lang._("OFF")}`;
  			$readabilityToggle.setAttribute("aria-pressed", "false");
  			document
  				.getElementById("sa11y-readability-panel")
  				.classList.remove("sa11y-active");
  			resetAll(false);
  			await checkAll();
  		} else {
  			localStorage.setItem("sa11y-remember-readability", "On");
  			$readabilityToggle.textContent = `${Lang._("ON")}`;
  			$readabilityToggle.setAttribute("aria-pressed", "true");
  			document
  				.getElementById("sa11y-readability-panel")
  				.classList.add("sa11y-active");
  			resetAll(false);
  			await checkAll();
  		}
  	};

  	if (localStorage.getItem("sa11y-remember-readability") === "On") {
  		document
  			.getElementById("sa11y-readability-panel")
  			.classList.add("sa11y-active");
  	}

  	// Toggle: Dark mode. (Credits: https://derekkedziora.com/blog/dark-mode-revisited)
  	const systemInitiatedDark = window.matchMedia("(prefers-color-scheme: dark)");
  	const $themeToggle = document.getElementById("sa11y-theme-toggle");
  	const theme = localStorage.getItem("sa11y-remember-theme");
  	const html = document.querySelector("html");

  	if (systemInitiatedDark.matches) {
  		$themeToggle.textContent = `${Lang._("ON")}`;
  		$themeToggle.setAttribute("aria-pressed", "true");
  	} else {
  		$themeToggle.textContent = `${Lang._("OFF")}`;
  		$themeToggle.setAttribute("aria-pressed", "false");
  	}

  	const prefersColorTest = () => {
  		if (systemInitiatedDark.matches) {
  			html.setAttribute("data-sa11y-theme", "dark");
  			$themeToggle.textContent = `${Lang._("ON")}`;
  			$themeToggle.setAttribute("aria-pressed", "true");
  			localStorage.setItem("sa11y-remember-theme", "");
  		} else {
  			html.setAttribute("data-sa11y-theme", "light");
  			$themeToggle.textContent = `${Lang._("OFF")}`;
  			$themeToggle.setAttribute("aria-pressed", "false");
  			localStorage.setItem("sa11y-remember-theme", "");
  		}
  	};

  	systemInitiatedDark.addEventListener("change", prefersColorTest);
  	$themeToggle.onclick = async () => {
  		const theme = localStorage.getItem("sa11y-remember-theme");
  		if (theme === "dark") {
  			html.setAttribute("data-sa11y-theme", "light");
  			localStorage.setItem("sa11y-remember-theme", "light");
  			$themeToggle.textContent = `${Lang._("OFF")}`;
  			$themeToggle.setAttribute("aria-pressed", "false");
  		} else if (theme === "light") {
  			html.setAttribute("data-sa11y-theme", "dark");
  			localStorage.setItem("sa11y-remember-theme", "dark");
  			$themeToggle.textContent = `${Lang._("ON")}`;
  			$themeToggle.setAttribute("aria-pressed", "true");
  		} else if (systemInitiatedDark.matches) {
  			html.setAttribute("data-sa11y-theme", "light");
  			localStorage.setItem("sa11y-remember-theme", "light");
  			$themeToggle.textContent = `${Lang._("OFF")}`;
  			$themeToggle.setAttribute("aria-pressed", "false");
  		} else {
  			html.setAttribute("data-sa11y-theme", "dark");
  			localStorage.setItem("sa11y-remember-theme", "dark");
  			$themeToggle.textContent = `${Lang._("ON")}`;
  			$themeToggle.setAttribute("aria-pressed", "true");
  		}
  	};
  	if (theme === "dark") {
  		html.setAttribute("data-sa11y-theme", "dark");
  		localStorage.setItem("sa11y-remember-theme", "dark");
  		$themeToggle.textContent = `${Lang._("ON")}`;
  		$themeToggle.setAttribute("aria-pressed", "true");
  	} else if (theme === "light") {
  		html.setAttribute("data-sa11y-theme", "light");
  		localStorage.setItem("sa11y-remember-theme", "light");
  		$themeToggle.textContent = `${Lang._("OFF")}`;
  		$themeToggle.setAttribute("aria-pressed", "false");
  	}
  }

  function mainToggle() {
  	// Keeps checker active when navigating between pages until it is toggled off.
  	document.getElementById("sa11y-panel");
  	const sa11yToggle = document.getElementById("sa11y-toggle");
  	checkAll();
  	sa11yToggle.addEventListener('click', (e) => {
          if (localStorage.getItem('sa11y-remember-panel') === 'Opened') {
            localStorage.setItem('sa11y-remember-panel', 'Closed');
            sa11yToggle.classList.remove('sa11y-on');
            sa11yToggle.setAttribute('aria-expanded', 'false');
            resetAll();
            updateBadge();
            e.preventDefault();
          } else {
            localStorage.setItem('sa11y-remember-panel', 'Opened');
            sa11yToggle.classList.add('sa11y-on');
            sa11yToggle.setAttribute('aria-expanded', 'true');
            checkAll();
            // Don't show badge when panel is opened.
            document.getElementById('sa11y-notification-badge').style.display = 'none';
            e.preventDefault();
          }
        });

  	// Remember to leave it open
  	if (localStorage.getItem("sa11y-remember-panel") === "Opened") {
  		sa11yToggle.classList.add("sa11y-on");
  		sa11yToggle.setAttribute("aria-expanded", "true");
  	}

  	// Crudely give time to load any other content or slow post-rendered JS, iFrames, etc.
  	if (sa11yToggle.classList.contains("sa11y-on")) {
  		sa11yToggle.classList.toggle("loading-sa11y");
  		sa11yToggle.setAttribute("aria-expanded", "true");
  		setTimeout(checkAll, 400);
  	}

  	document.onkeydown = (e) => {
  		const evt = e || window.event;

  		// Escape key to shutdown.
  		let isEscape = false;
  		if ("key" in evt) {
  			isEscape = evt.key === "Escape" || evt.key === "Esc";
  		} else {
  			isEscape = evt.keyCode === 27;
  		}
  		if (
  			isEscape &&
  			document.getElementById("sa11y-panel").classList.contains("sa11y-active")
  		) {
  			sa11yToggle.setAttribute("aria-expanded", "false");
  			sa11yToggle.classList.remove("sa11y-on");
  			sa11yToggle.click();
  			resetAll();
  		}

  		// Alt + A to enable accessibility checker.
  		if (evt.altKey && evt.code === "KeyA") {
  			sa11yToggle.click();
  			sa11yToggle.focus();
  			evt.preventDefault();
  		}
  	};
  }

  function skipToIssueTooltip() {
  	let keyboardShortcut;
  	if (navigator.userAgent.indexOf("Mac") !== -1) {
  		keyboardShortcut =
  			'<span class="sa11y-kbd">Option</span> + <span class="sa11y-kbd">S</span>';
  	} else {
  		keyboardShortcut =
  			'<span class="sa11y-kbd">Alt</span> + <span class="sa11y-kbd">S</span>';
  	}

  	tippy("#sa11y-cycle-toggle", {
  		content: `<div style="text-align:center">${Lang._(
			"SHORTCUT_TOOLTIP"
		)} &raquo;<br>${keyboardShortcut}</div>`,
  		allowHTML: true,
  		delay: [900, 0],
  		trigger: "mouseenter focusin",
  		arrow: true,
  		placement: "top",
  		theme: "sa11y-theme",
  		aria: {
  			content: null,
  			expanded: false,
  		},
  		appendTo: document.body,
  	});
  }

  const checkRunPrevent = () => {
  	const { doNotRun } = option;
  	return doNotRun.trim().length > 0 ? document.querySelector(doNotRun) : false;
  };

  const documentLoadingCheck = (callback) => {
  	if (document.readyState === "complete") {
  		callback();
  	} else {
  		window.addEventListener("load", callback);
  	}
  };

  function Sa11y$1() {
  	if (!checkRunPrevent()) {
  		documentLoadingCheck(() => {
  			buildSa11yUI();
  			settingPanelToggles();
  			mainToggle();
  			skipToIssueTooltip();

  			// Pass Sa11y instance to custom checker
  			// if (option.customChecks && option.customChecks.setSa11y) {
  			// 	option.customChecks.setSa11y(this);
  			//   }

  			document.getElementById("sa11y-toggle").disabled = false;
  			if (
  				localStorage.getItem("sa11y-remember-panel") === "Closed" ||
  				!localStorage.getItem("sa11y-remember-panel")
  			) {
  				setPanel(true);
  				checkAll();
  			}
  		});
  	}
  }

  /*-----------------------------------------------------------------------
  * Sa11y, the accessibility quality assurance assistant.
  * @version: 2.3.0
  * @author: Development led by Adam Chaboryk, CPWA
  * @acknowledgements: https://sa11y.netlify.app/acknowledgements/
  * @license: https://github.com/ryersondmp/sa11y/blob/master/LICENSE.md
  * Copyright (c) 2020 - 2022 Toronto Metropolitan University (formerly Ryerson University).
  * The above copyright notice shall be included in all copies or
  substantial portions of the Software.
  ------------------------------------------------------------------------*/

  function Sa11y() {
  	Sa11y$1();
  }

  exports.Sa11y = Sa11y;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
