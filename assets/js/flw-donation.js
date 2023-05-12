var pp;

jQuery( function( $ ) {

    /**
     * Builds config object to be sent to GetPaid
     *
     * @return object - The config object
     */
    const buildConfigObj = function( form ) {
        let formData = $( form ).data();
        let amount = formData.amount || $(form).find('#flw-amount').val();
        let email = formData.email || $(form).find('#flw-customer-email').val();
        let firstname = formData.firstname || $(form).find('#flw-first-name').val();
        let lastname = formData.lastname || $(form).find('#flw-last-name').val();
        let formCurrency = formData.currency || $(form).find('#flw-currency').val();
        let formId = form.attr('id');
        let txref   = 'WP_' + formId.toUpperCase() + '_' + new Date().valueOf();
        let setCountry; //set country

        //switch the country with form currency provided
        setCountry = flw_pay_options.countries[formCurrency] ? flw_pay_options.countries[formCurrency]: flw_pay_options.countries['NGN'];

        let redirect_url = window.location.origin;

        return {
            amount: amount,
            country: setCountry, //flw_pay_options.country,
            currency: formCurrency ?? flw_pay_options.currency,
            customer: {
                email,
                phone_number: null,
                name: firstname + ' ' + lastname,
            },
            payment_options: flw_pay_options.method,
            public_key: flw_pay_options.public_key,
            tx_ref: txref,
            customizations: {
                title: flw_pay_options.title,
                description: flw_pay_options.desc,
                logo: flw_pay_options.logo,
            },
            form_id: formId
        };
    };

    const processCheckout = function(opts, form) {
        let args  = {
            action: 'get_payment_url',
            flw_sec_code: $( form ).find( '#flw_sec_code' ).val(),
            payment_type: $( form ).find( '#flw-payment-type').val(),
        };

        let dataObj = Object.assign( {}, args, opts);
        $
            .post( flw_pay_options.cb_url, dataObj )
            .success( function( data ) {
                let response  = JSON.parse( data );

                if(response.status === 'error') {
                    $('.flw-error').html(response.message ).attr('style', 'color:red');
                } else{
                    $.unblockUI();
                    redirectTo(response.url);
                }
            })
    };

    /**
     * Sends payment response from GetPaid to the process payment endpoint
     *
     * @param object Response object from GetPaid
     *
     * @return void
     */
    const sendPaymentRequestResponse = function( res, form ) {
        let args  = {
            action: 'process_payment',
            flw_sec_code: $( form ).find( '#flw_sec_code' ).val(),
        };

        let dataObj = Object.assign( {}, args, res.tx );

        $
            .post( flw_pay_options.cb_url, dataObj )
            .success( function(data) {
                var response  = JSON.parse( data );
                redirectUrl   = response.redirect_url;

                if ( redirectUrl === '' ) {

                    var responseMsg  = ( res.tx.paymentType === 'account' ) ? res.tx.acctvalrespmsg  : res.tx.vbvrespmessage;
                    $( form )
                        .find( '#notice' )
                        .text( responseMsg )
                        .removeClass( function() {
                            return $( form ).find( '#notice' ).attr( 'class' );
                        } )
                        .addClass( response.status );

                } else {

                    setTimeout( redirectTo, 5000, redirectUrl );

                }

            } );
    };

    /**
     * Redirect to set url
     *
     * @param string url - The link to redirect to
     *
     * @return void
     */
    const redirectTo = function( url ) {

        if ( url ) {
            location.href = url;
        }

    };

    // for each form process payments
    $( '.flw-donation-form' ).each( function() {

        let form = $( this );

        form.find('#flw-payment-type').on('change', function() {
            let option = $(this).val();
            let btn = jQuery('.flw-donation-form').find('#flw-pay-now-button');
            let fullText = "DONATE " + option.toUpperCase();
            btn.text(null);
            console.log(btn.text());
            btn.text(fullText);
        });

        form.on('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission
            let btn = form.find('button');
            btn.prop('disabled', true);

            let inputs = form.find('input[type="text"]');
            let isValid = true;

            inputs.each(function() {
                let inputValue = $(this).val();
                if (typeof inputValue === 'string' && inputValue.trim() === '') {
                    isValid = false;
                    $(this).attr('style', 'border-color: red');
                } else {
                    $(this).attr('style', 'border-color: green');
                }
            });

            if(isValid) {
                let config = buildConfigObj( form );
                console.log(config);
                processCheckout( config, form );
            } else {
                //unblur button.
                btn.prop('disabled', false);
            }
        });
    });
});


