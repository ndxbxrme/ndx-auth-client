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

  module.factory('auth', function($http, $q, $state, $window, $injector) {
    var checkRoles, current, currentParams, getUserPromise, hasRole, loading, prevParams, redirect, user;
    user = null;
    loading = false;
    redirect = 'dashboard';
    current = '';
    currentParams = null;
    prev;
    prevParams = null;
    getUserPromise = function() {
      var defer;
      console.log($state);
      current = $state.current.name;
      currentParams = $state.params;
      loading = true;
      defer = $q.defer();
      if (user) {
        defer.resolve(user);
        loading = false;
      } else {
        $http.post('/api/refresh-login').then(function(data) {
          var socket;
          loading = false;
          if (data && data.data && data.data !== 'error') {
            user = data.data;
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
      var allgood, getKey, i, key, keys, len, root;
      getKey = function(root, key) {
        return root[key];
      };
      keys = role.split(/\./g);
      allgood = false;
      if (user.roles) {
        root = user.roles;
        for (i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          root = getKey(root, key);
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
        getUserPromise().then(function() {
          var truth;
          if (role) {
            truth = checkRoles(role, isAnd);
            if (truth) {
              return defer.resolve(user);
            } else {
              $state.go(redirect);
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
            return $state.go(redirect);
          }
        });
        return defer.promise;
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
      redirect: redirect,
      goToNext: function() {
        var prev;
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
      goToLast: function() {
        if (prev) {
          return $state.go(prev, prevParams);
        } else {
          return $state.go(redirect);
        }
      },
      logOut: function() {
        return $window.location.href = '/api/logout';
      }
    };
  }).run(function($rootScope, auth) {
    var root;
    root = Object.getPrototypeOf($rootScope);
    return root.auth = auth;
  });

}).call(this);

//# sourceMappingURL=ndx-auth.js.map
