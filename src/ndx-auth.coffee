'use strict'
module = null
try
  module = angular.module 'ndx'
catch e
  module = angular.module 'ndx', []
module.factory 'auth', ($http, $q, $state) ->
  user = null
  loading = false
  redirect = 'dashboard'
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
        if data and data.data and data.data isnt 'error'
          user = data.data
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
  getUser: ->
    user
  loading: ->
    loading
  checkRoles: (role) ->
    if user
      checkRoles role
  checkAllRoles: (role) ->
    if user
      checkRoles role, true
  redirect: redirect
.run ($rootScope, auth) ->
  root = Object.getPrototypeOf $rootScope
  root.auth = auth