(function($) {

    $('#logButton').on('click',function(e){

        var login = $('#login').val()
        var pass = $('#pass').val()

        if(login && pass){
            
            $.ajax({
                method:"POST",
                url:"/users/getLogin",
                data: {
                    "login":login , 
                    "pass":pass
                },
                dataType: "json",
                success:function(result){

                    // Salva os dados na sessionStorage
                    sessionStorage.setItem('session', true);
                    sessionStorage.setItem('name', result.name);

                    window.location.href = '/'
                },
                error: function(error,status){

                    iziToast.error({
                        title: 'Erro',
                        message: 'Erro na requisição: ' + error.responseJSON.error,
                        position: 'topRight'
                    });
                }
            })

        }else{

            iziToast.info({
                title: 'Atenção',
                message: 'Preencha Login e Senha!',
                position: 'topRight'
            });

        }

    })
    
}(jQuery));