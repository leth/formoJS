if (typeof FormoJS == 'undefined')
	FormoJS = {};

FormoJS.Form = new Class({
	element: null,
	focus:   null,
	fields: [],
	
	initialize: function (element)
	{
		this.element = element;
		element.getElements('input[type!=submit]')
			.each(function (field) {
				var fieldObj = new FormoJS.Field(field);
				this.fields.push(fieldObj);
				// TODO future feature
				// field.startFocusTracking(this);
				field.addEvent('blur', this.field_blurred.bindWithEvent(this, [field, fieldObj]));
			}, this);
	},
	
	field_blurred: function (event, field, fieldObj)
	{
		fieldObj.validate();
	}
	
});

FormoJS.Field = new Class({
	element: null,

	initialize: function (element)
	{
		this.element = element;
	},
	
	get_block: function () {
		return this.element.getParent().getParent().getParent();
	},
	
	validate: function ()
	{
		var block = this.get_block();
		var self = this;
		
		var request = new Request.JSON({
			url: FormoJS.validate_url + 'field',
			onRequest: function () {
				block.removeClass('valid');
				block.removeClass('error');
				block.removeClass('server_error');
				block.addClass('validating');
			},
			onComplete: function() {
				block.removeClass('validating');
			},
			onFailure: function () {
				block.addClass('server_error');
				
				// TODO add more warning next to field
				self.set_message(this.xhr.responseText);
			},
			onSuccess: function (responseJSON, responseText) {
				if (responseJSON.status == 'valid')
					block.addClass('valid');
				else if (responseJSON.status == 'invalid')
					block.addClass('error');
				else
					block.addClass('server_error');
				
				self.set_message(responseJSON.message);
			}
		});
		request.setHeader('Referer', String(document.location));
		request.send({
			data: 'field=' + this.element.name + '&value=' + this.element.value
		});
	},
	
	set_message: function (message)
	{
		this.get_block().getElement('.error-message').set('html', message);
	}
});

// Disabled for a future feature
// FormoJS.FocusTracker = {
// 	startFocusTracking: function(form)
// 	{
// 		this.store('hasFocus', false);
// 		this.addEvent('focus', function() { this.store('hasFocus', true ); form.focus = this; });
// 		this.addEvent('blur' , function() { this.store('hasFocus', false); form.focus = null; });
// 	},	
// 	hasFocus: function()
// 	{
// 		return this.retrieve('hasFocus');
// 	}
// };
// Element.implement(FormoJS.FocusTracker);

window.addEvent('domready', function() {
	if (typeof FormoJS.validate_url == 'undefined')
	{
		if (typeof console != 'undefined')
			console.log('Validation URL not configured.');
		return;
	}
	
	$$('.formo_form').each(function (form) {
		new FormoJS.Form(form);
	});
});