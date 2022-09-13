(function($) {

    $('#dtb_execs').dataTable({
        "language":{
            "emptyTable": "Sem dados disponíveis na tabela.",
            "info":"Mostrando _START_ à _END_ de _TOTAL_ registros",
            "lengthMenu": "Mostrando _MENU_ registros",
            "infoFiltered": "(filtrado de _MAX_ registros)",
            "zeroRecords": "Nenhum registro encontrado",
            "search": "Pesquisar:",
            "paginate": {
                first:    'Primeiro',
                previous: 'Anterior',
                next:     'Próximo',
                last:     'Último'
            },
            "aria": {
                paginate: {
                    first:    'Primeiro',
                    previous: 'Anterior',
                    next:     'Próximo',
                    last:     'Último'
                }
            }
        }
    })

})(jQuery);