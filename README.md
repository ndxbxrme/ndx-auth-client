# ndx-auth-client
### clientside user authentication for ndx-framework apps
install with  
`bower install --save ndx-auth`  
## examples
- refreshes the user but doesn't block page load  
```coffeescript
angular.module 'myApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'dashboard',
    url: '/'
    templateUrl: 'routes/dashboard/dashboard.html'
    controller: 'DashboardCtrl'
    resolve:
      user: (auth) ->
        auth.getPromise false
```
- refreshes the user and blocks page load if she doesn't exist  
```coffeescript
angular.module 'myApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'dashboard',
    url: '/'
    templateUrl: 'routes/dashboard/dashboard.html'
    controller: 'DashboardCtrl'
    resolve:
      user: (auth) ->
        auth.getPromise true
```
- refreshes the user and blocks page load if she doesn't exist  
```coffeescript
angular.module 'myApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'dashboard',
    url: '/'
    templateUrl: 'routes/dashboard/dashboard.html'
    controller: 'DashboardCtrl'
    resolve:
      user: (auth) ->
        auth.getPromise true
```
### with [ndx-user-roles](https://github.com/ndxbxrme/ndx-user-roles)
- blocks page load if user doesn't have `superadmin` or `admin` roles  
```coffeescript
angular.module 'myApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'setup',
    url: '/setup'
    templateUrl: 'routes/setup/setup.html'
    controller: 'SetupCtrl'
    resolve:
      user: (auth) ->
        auth.getPromise ['superadmin', 'admin']
```
- blocks page load if user doesn't have `superadmin` AND `admin` roles  
```coffeescript
angular.module 'myApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'setup',
    url: '/setup'
    templateUrl: 'routes/setup/setup.html'
    controller: 'SetupCtrl'
    resolve:
      user: (auth) ->
        auth.getPromise ['superadmin', 'admin'], true
```
## scope
ndx-auth attatches itself to $scope and can be used anywhere there is a scope  
`src/client/../example.jade`  
#### `auth.getUser()`  
returns the logged in user  
```jade
.menu(ng-show='auth.getUser()') Only shows when logged in
  .email {{auth.getUser().local.email}}
```  
#### `auth.loading()'  
`true` while loading  
```jade
.icon(ng-show='auth.loading()') Loading user details
```
#### `auth.checkRoles()`  
`true` if user has any of the specified roles  
```jade
.secret-info(ng-show="auth.checkRoles(['superadmin', 'admin'])") Secret
```
#### `auth.checkAllRoles()`  
`true` if user hass all of the specified roles  
```jade
.secret-info(ng-show="auth.checkRoles(['superadmin', 'admin'])") Secret
```