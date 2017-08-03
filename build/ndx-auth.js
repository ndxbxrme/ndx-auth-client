(function() {
  'use strict';
  var e, error, module;

  module = null;

  try {
    module = angular.module('ndx');
  } catch (error) {
    e = error;
    module = angular.module('ndx', []);
  }

  module.provider('Auth', function() {
    var settings;
    settings = {
      redirect: 'dashboard'
    };
    return {
      config: function(args) {
        return angular.extend(settings, args);
      },
      $get: function($http, $q, $state, $window, $injector) {
        var checkRoles, current, currentParams, getUserPromise, hasRole, loading, prev, prevParams, user, userCallbacks;
        user = null;
        loading = false;
        current = '';
        currentParams = null;
        prev = '';
        prevParams = null;
        userCallbacks = [];
        getUserPromise = function() {
          var defer;
          loading = true;
          defer = $q.defer();
          if (user) {
            defer.resolve(user);
            loading = false;
          } else {
            $http.post('/api/refresh-login').then(function(data) {
              var callback, error1, i, len, socket;
              loading = false;
              if (data && data.data && data.data !== 'error' && data.status !== 401) {
                user = data.data;
                for (i = 0, len = userCallbacks.length; i < len; i++) {
                  callback = userCallbacks[i];
                  try {
                    if (typeof callback === "function") {
                      callback(user);
                    }
                  } catch (error1) {
                    e = error1;
                    false;
                  }
                }
                userCallbacks = [];
                if ($injector.has('socket')) {
                  socket = $injector.get('socket');
                  socket.emit('user', user);
                  socket.on('connect', function() {
                    return socket.emit('user', user);
                  });
                }
                return defer.resolve(user);
              } else {
                user = null;
                return defer.reject({});
              }
            }, function() {
              loading = false;
              user = null;
              return defer.reject({});
            });
          }
          return defer.promise;
        };
        hasRole = function(role) {
          var allgood, getKey, i, k, key, keys, len, root;
          getKey = function(root, key) {
            return root[key];
          };
          keys = role.split(/\./g);
          allgood = false;
          if (user.roles) {
            root = user.roles;
            for (i = 0, len = keys.length; i < len; i++) {
              key = keys[i];
              if (key === '*') {
                for (k in root) {
                  root = root[k];
                  break;
                }
              } else {
                root = getKey(root, key);
              }
              if (root) {
                allgood = true;
              } else {
                allgood = false;
                break;
              }
            }
          }
          return allgood;
        };
        checkRoles = function(role, isAnd) {
          var getRole, i, len, r, rolesToCheck, truth;
          rolesToCheck = [];
          getRole = function(role) {
            var i, len, r, results, type;
            type = Object.prototype.toString.call(role);
            if (type === '[object Array]') {
              results = [];
              for (i = 0, len = role.length; i < len; i++) {
                r = role[i];
                results.push(getRole(r));
              }
              return results;
            } else if (type === '[object Function]') {
              r = role(req);
              return getRole(r);
            } else if (type === '[object String]') {
              if (rolesToCheck.indexOf(role) === -1) {
                return rolesToCheck.push(role);
              }
            }
          };
          getRole(role);
          truth = isAnd ? true : false;
          for (i = 0, len = rolesToCheck.length; i < len; i++) {
            r = rolesToCheck[i];
            if (isAnd) {
              truth = truth && hasRole(r);
            } else {
              truth = truth || hasRole(r);
            }
          }
          return truth;
        };
        return {
          getPromise: function(role, isAnd) {
            var defer;
            defer = $q.defer();
            if (Object.prototype.toString.call(role) === '[object Boolean]' && role === false) {
              defer.resolve({});
            } else {
              getUserPromise().then(function() {
                var truth;
                if (role) {
                  truth = checkRoles(role, isAnd);
                  if (truth) {
                    return defer.resolve(user);
                  } else {
                    $state.go(settings.redirect);
                    return defer.reject({});
                  }
                } else {
                  return defer.resolve(user);
                }
              }, function() {
                if (!role) {
                  return defer.resolve({});
                } else {
                  defer.reject({});
                  return $state.go(settings.redirect);
                }
              });
            }
            return defer.promise;
          },
          clearUser: function() {
            return user = null;
          },
          getUser: function() {
            return user;
          },
          loggedIn: function() {
            return user || $state.current.name === 'invited' || $state.current.name === 'forgot';
          },
          loading: function() {
            return loading;
          },
          checkRoles: function(role) {
            if (user) {
              return checkRoles(role);
            }
          },
          checkAllRoles: function(role) {
            if (user) {
              return checkRoles(role, true);
            }
          },
          isAuthorized: function(stateName) {
            var ref, ref1, roles;
            if (user) {
              roles = (ref = $state.get(stateName)) != null ? (ref1 = ref.data) != null ? ref1.auth : void 0 : void 0;
              return checkRoles(roles);
            }
          },
          redirect: settings.redirect,
          goToNext: function() {
            if (current) {
              $state.go(current, currentParams);
              if (current !== prev || JSON.stringify(currentParams) !== JSON.stringify(prevParams)) {
                prev = current;
                return prevParams = currentParams;
              }
            } else {
              return $state.go(redirect);
            }
          },
          goToLast: function(_default, defaultParams) {
            if (prev) {
              return $state.go(prev, prevParams);
            } else if (_default) {
              return $state.go(_default, defaultParams);
            } else {
              return $state.go(redirect);
            }
          },
          logOut: function() {
            return $window.location.href = '/api/logout';
          },
          onUser: function(func) {
            if (user) {
              return typeof func === "function" ? func(user) : void 0;
            } else {
              if (userCallbacks.indexOf(func) === -1) {
                return userCallbacks.push(func);
              }
            }
          },
          config: function(args) {
            return angular.extend(settings, args);
          },
          settings: settings,
          current: function(_current, _currentParams) {
            if (prev !== current && prevParams !== currentParams) {
              prev = current;
              prevParams = Object.assign({}, currentParams);
            }
            current = _current;
            return currentParams = _currentParams;
          }
        };
      }
    };
  }).run(function($rootScope, $state, $transitions, Auth) {
    var root;
    root = Object.getPrototypeOf($rootScope);
    root.auth = Auth;
    $transitions.onBefore({}, function(trans) {
      var data;
      Auth.current(trans.$to().name, trans.$to().data);
      data = trans.$to().data || {};
      return Auth.getPromise(data.auth);
    });
    return $transitions.onStart({}, function(trans) {
      var title;
      title = (trans.$to().data || {}).title || '';
      if (Auth.settings) {
        return document.title = "" + (Auth.settings.titlePrefix || '') + title + (Auth.settings.titleSuffix || '');
      }
    });
  });

}).call(this);

//# sourceMappingURL=ndx-auth.js.map
