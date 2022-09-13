(function($) {
    $('#form-api-dbmanager').submit(function( event ) {
        var baseurl = $('#baseurl').val()
        var endpoint1 = $('#endpoint1').val()

        if(baseurl && endpoint1){
            $.ajax({
                method:"POST",
                url:"/config/setConfig",
                data: {
                    "baseurl":baseurl , 
                    "endpoint":endpoint1
                },
                dataType: "json",
                success:function(result){
                    iziToast.success({
                        title: 'Sucesso',
                        message: 'Configurações salvas com sucesso!',
                        position: 'topRight'
                    });
                },
                error: function(error){
                    iziToast.error({
                        title: 'Erro',
                        message: 'Erro ao salvar: ' + error,
                        position: 'topRight'
                    });
                }
            })
            event.preventDefault();
        }else{
            event.preventDefault();
        }
      });


      $.ajax({
        method:"GET",
        url:"/config/getConfig",
        dataType: "json",
        success:function(result){
            $('#baseurl').val(result.baseurl)
            $('#endpoint1').val(result.endpoint)
        },
        error: function(error){
            console.log('Error',error)
            iziToast.error({
                title: 'Erro',
                message: 'Erro ao recuperar configurações: ' + error.status + ' ' + error.statusText,
                position: 'topRight'
            });
        }
    })

    $("#modal").iziModal({
        title: 'Digite o Token',
        subtitle: '',
        headerColor: '#212529'
    });
    

    $(document).on('click', '.trigger', function (e) {
        e.preventDefault();
        $('#modal').iziModal('open');
    });

    $('#saveToken').on('click',function(e){

        var authtoken = $('#authtoken').val()

        $.ajax({
            method:"POST",
            url:"/config/setConfig",
            data: {
                "authtoken":authtoken
            },
            dataType: "json",
            success:function(result){
                iziToast.success({
                    title: 'Sucesso',
                    message: 'Token salvo com sucesso!',
                    position: 'topRight'
                });
            },
            error: function(error){
                iziToast.error({
                    title: 'Erro',
                    message: 'Erro ao salvar: ' + error,
                    position: 'topRight'
                });
            }
        })
        event.preventDefault();
    })
    

})(jQuery);