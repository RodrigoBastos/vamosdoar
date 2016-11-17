angular.module("app")
  .controller("MainPanel.Controller", function ($scope, Auth, $state, $mdDialog, $mdToast, $http, Ref, $timeout) {

    var mapOptions = {
      zoom: 15,
      center: new google.maps.LatLng(-9.626925, -35.738214200000016),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    $scope.today = moment()
        .hours(23)
        .minutes(59)
        .seconds(59)
        .toDate();
    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    $scope.geocoder = new google.maps.Geocoder();

    $scope.markers = [];
    $scope.categories = ['Alimentos', 'Brinquedos', 'Roupas', 'Outras'];

    var infoWindow = new google.maps.InfoWindow();

    var createMarker = function (info){

      var marker = new google.maps.Marker({
        map: $scope.map,
        position: new google.maps.LatLng(info.lat, info.long),
        title: info.category
      });
      marker.content = "<div class='infoWindowContent'><strong>Doador:</strong> "+ info.name + "<br> <strong>Quantidade:</strong> "+ info.amount+" </div><button class='md-raised md-primary md-button md-ink-ripple btn-interest' ng-click='setInteresse(marker)'>Tenho Interesse</button>";
      // Passando scope para o marker
      //marker.content = $compile(htmlMarkerContent)($scope)[0].innerHTML;

      google.maps.event.addListener(marker, "click", function(){

        if(marker.title == "Alimentos"){
            marker.icon = "restaurant";
        } else if(marker.title == "Brinquedos") {
            marker.icon = "child_care";
        } else if(marker.title == "Roupas") {
            marker.icon = "person";
        } else {
            marker.icon = "beenhere";
        }
            
        infoWindow.setContent("<h2 class='box-marker'><i class='material-icons icon-" + marker.icon + "'>" + marker.icon + "</i> " + marker.title + "</h2>" + marker.content);
        infoWindow.open($scope.map, marker);
      });

      $scope.markers.push(marker);

    };

    var donationsRef = Ref.child("donations");

    // Evento para identificar o usuário atual
    Auth.onAuthStateChanged(function(user) {
      if (user) {
        $timeout(function () {
          donationsRef.on("child_added", function (snap) {
            var donation = snap.val();
            donation.key = snap.key;
            createMarker(donation);
          });
        });
      } else {
        //ToDo - Pensar o que fazer aqui (melhor opção redirecionar para o login)
        console.log("Não autorizado");
        $timeout($state.go("account", {state: "login"}));
      }
    });



    $scope.openInfoWindow = function(e, selectedMarker){
      e.preventDefault();
      google.maps.event.trigger(selectedMarker, "click");
    };

     // ToDo - Criar factory para busca de endereço
     $scope.getAddress = function () {
      $scope.geocoder.geocode( { "address": $scope.address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          $scope.map.setCenter(results[0].geometry.location);
        } else alert("Geocode was not successful for the following reason: " + status);
      });
    };

    $scope.getInteresse = function (item) {
      console.log(item);
    };

    $scope.getAddressByCEP = function() {
        var cep = $scope.new.cep ? $scope.new.cep.replace(/-|\s/g,"") : undefined;

        if(cep) {
            if(cep.length > 7){
                $http.get('https://viacep.com.br/ws/' + $scope.new.cep + '/json/')
                  .success(function(response){
                      if(response.logradouro)
                        $scope.new.address = response.logradouro;
                      if(response.bairro)
                        $scope.new.address += (", " + response.bairro);
                      if(response.localidade)
                        $scope.new.address += (", " + response.localidade);
                      if(response.uf)
                        $scope.new.address += (", " + response.uf);
                  })
                  .error(function(){
                      $mdToast.show($mdToast.simple().textContent('CEP não encontrado'));
                      $scope.new.address = "";
                  });
            }
        } else {
            $scope.new.address = "";
        }
    };

    $scope.createDonation = function () {
      var donationsRef = Ref.child("donations");
      var donation = donationsRef.push();

      $scope.geocoder.geocode( { "address": $scope.new.address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

          $scope.new.lat = results[0].geometry.location.lat();
          $scope.new.long = results[0].geometry.location.lng();
          $scope.map.setCenter(results[0].geometry.location);

          $scope.new.uid = Auth.currentUser.uid;
          $scope.new.name = Auth.currentUser.displayName;

          donation.set($scope.new);
        }
      });
    };

    $scope.newDonation = function () {

      $mdDialog.show({
        preserveScope: true,
        scope: $scope,
        templateUrl: "newDonation",
        clickOutsideToClose: true,
        fullscreen: false
      }).then(function (type) {
        if (type == "donation") $scope.createDonation();
      });
    };

    function createScheduled() {

    }

    $scope.newScheduled = function (marker) {

      console.log(marker);

      $mdDialog.show({
        preserveScope: true,
        scope: $scope,
        templateUrl: "newScheduled",
        clickOutsideToClose: true,
        fullscreen: false
      }).then(function (type) {
        if (type == "scheduled") createScheduled();
      });
    };

  });
