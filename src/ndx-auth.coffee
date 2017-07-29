'use strict'
module = null
try
  module = angular.module 'ndx'
catch e
  module = angular.module 'ndx', []
module.factory 'Auth', ($http, $q, $state, $window, $injector) ->
  settings = {}
  user = null
  loading = false
  redirect = 'dashboard'
  current = ''
  currentParams = null
  prev = ''
  prevParams = null
  userCallbacks = []
  getUserPromise = () ->
    loading = true
    defer = $q.defer()
    if user
      defer.resolve user
      loading = false
    else
      $http.post '/api/refresh-login'
      .then (data) ->
        loading = false
        if data and data.data and data.data isnt 'error' and data.status isnt 401
          user = data.data
          for callback in userCallbacks
            try
              callback? user
            catch e
              false
          userCallbacks = []
          if $injector.has 'socket'
            socket = $injector.get 'socket'
            socket.emit 'user', user
            socket.on 'connect', ->
              socket.emit 'user', user
          defer.resolve user
        else 
          user = null
          defer.reject {}
      , ->
        loading = false
        user = null
        defer.reject {}
    defer.promise
  hasRole = (role) ->
    getKey = (root, key) ->
      root[key]
    keys = role.split /\./g
    allgood = false
    if user.roles
      root = user.roles
      for key in keys
        root = getKey root, key
        if root
          allgood = true
        else
          allgood = false
          break
    allgood
  checkRoles = (role, isAnd) ->
    rolesToCheck = []
    getRole = (role) ->
      type = Object.prototype.toString.call role
      if type is '[object Array]'
        for r in role
          getRole r
      else if type is '[object Function]'
        r = role req
        getRole r
      else if type is '[object String]'
        if rolesToCheck.indexOf(role) is -1
          rolesToCheck.push role
    getRole role
    truth = if isAnd then true else false
    for r in rolesToCheck
      if isAnd
        truth = truth and hasRole(r)
      else
        truth = truth or hasRole(r)
    truth
  getPromise: (role, isAnd) ->
    defer = $q.defer()
    if Object.prototype.toString.call(role) is '[object Boolean]' and role is false
      defer.resolve {}
    else
      getUserPromise()
      .then ->
        if role
          truth = checkRoles role, isAnd
          if truth
            defer.resolve user
          else
            $state.go redirect
            defer.reject {}
        else
          defer.resolve user
      , ->
        if not role
          defer.resolve {}
        else
          defer.reject {}
          $state.go redirect
    defer.promise
  clearUser: ->
    user = null
  getUser: ->
    user
  loggedIn: ->
    user or $state.current.name is 'invited' or $state.current.name is 'forgot'
  loading: ->
    loading
  checkRoles: (role) ->
    if user
      checkRoles role
  checkAllRoles: (role) ->
    if user
      checkRoles role, true
  redirect: redirect
  goToNext: ->
    if current
      $state.go current, currentParams
      if current isnt prev or JSON.stringify(currentParams) isnt JSON.stringify(prevParams)
        prev = current
        prevParams = currentParams
    else
      $state.go redirect
  goToLast: (_default, defaultParams) ->
    if prev
      $state.go prev, prevParams
    else if _default
      $state.go _default, defaultParams
    else
      $state.go redirect
  logOut: ->
    $window.location.href = '/api/logout'
  onUser: (func) ->
    if user
      func? user
    else
      if userCallbacks.indexOf(func) is -1
        userCallbacks.push func
  config: (args) ->
    angular.extend settings, args
  settings: settings
  current: (_current, _currentParams) ->
    if prev isnt current and prevParams isnt currentParams
      prev = current
      prevParams = Object.assign {}, currentParams
    current = _current
    currentParams = _currentParams
.run ($rootScope, $state, $transitions, Auth) ->
  root = Object.getPrototypeOf $rootScope
  root.auth = Auth
  $transitions.onBefore {}, (trans) ->
    Auth.current trans.$to().name, trans.$to().data
    data = trans.$to().data or {}
    Auth.getPromise data.auth
  $transitions.onStart {}, (trans) ->
    title = (trans.$to().data or {}).title or ''
    if Auth.settings
      document.title = "#{Auth.settings.titlePrefix or ''}#{title}#{Auth.settings.titleSuffix or ''}"