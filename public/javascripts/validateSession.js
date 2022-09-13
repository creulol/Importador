(function($) {

    // Valida se a sessão está ativa via sessionStorage
   var session =  sessionStorage.getItem('session');

   if(!session){
    window.location.href = '/login.html'
   }

}(jQuery));