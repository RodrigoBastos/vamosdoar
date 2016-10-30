angular.module("app")
  .controller("MainAccount.Controller", function ($scope, $state, Auth, $q, Ref, $stateParams, $mdToast) {

    if (Auth.currentUser) return $state.go("panel");

    if (!$stateParams.state) $state.go("account", _.defaults({ state:"login" }, $stateParams));

    $scope.user = { isInstitution: false };

    $scope.submit = function () {

      if ($stateParams.state === "login") {
        return login()
          .then(redirect, showError);
      }

      if ($stateParams.state === "signup") {
        return createAuth()
          .then(login)
          .then(createUser)
          .then(redirect, showError);
      }
    };

    function login() {
      return Auth.signInWithEmailAndPassword(
        $scope.user.email,
        $scope.user.password
      );
    }

    function createAuth () {
      return Auth.createUserWithEmailAndPassword(
        $scope.user.email,
        $scope.user.password
      );
    }

    function createUser(newAuth) {

      var profileRef = Ref.child("users").child(newAuth.uid);

      return getUser()
        .then(createNewUser);

      function getUser () {
        return $q(function(resolve, reject) {
          profileRef.once("value", function (snap) {
            if (snap.exists() && snap.val())
              return resolve(snap.val());
            return resolve(false)
          });
        })
      }

      function createNewUser (existingUser) {
        return $q(function (resolve, reject) {
          if (existingUser) return resolve(newAuth);

          var profileInfo = {};
          profileInfo.email = $scope.user.email;
          profileInfo.isInstitution = $scope.user.isInstitution;
          profileInfo.name = $scope.user.name;

          profileRef.update(profileInfo, function (err) {
            if(err) return reject(err);
            newAuth.updateProfile({ displayName: profileInfo.name});
            resolve(newAuth);
          });
        });
      }

    }

    function redirect () {
      $state.go("panel");
    }

    function showError(err) {
      $mdToast.show($mdToast.simple().textContent(err.message));
      console.error(err);
    }

  })
;
