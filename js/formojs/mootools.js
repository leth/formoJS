if (typeof FormoJS == 'undefined')
	FormoJS = {};

FormoJS.Form = new Class({
	// The DOM element for the form
	element: null,
	// TODO future feature
	// // Current focus within this form
	// focus:   null,
	// Fields within this form
	fields: [],
	
	initialize: function (element)
	{
		this.element = element;
		// look for fields within this form
		element.getElements('input[type!=submit]')
			.each(function (field) {
				var fieldObj = new FormoJS.Field(field, this);
				this.fields.push(fieldObj);
				// TODO future feature
				// field.startFocusTracking(this);
				field.addEvent('change', this.field_blurred.bindWithEvent(this, [field, fieldObj]));
				field.addEvent('keypress', this.field_keypress.bindWithEvent(this, [field, fieldObj]));
			}, this);
	},
	
	// Delay timer on keypresses
	keypress_timer: null,
	
	field_blurred: function (event, field, fieldObj)
	{
		// Clear any remaining timer events on this field
		if (this.keypress_timer != null)
			$clear(this.keypress_timer);
		
		fieldObj.validate();
	},
	
	field_keypress: function (event, field, fieldObj)
	{
		// Clear the timer if it was already started
		if (this.keypress_timer != null)
			$clear(this.keypress_timer);
		
		// Start a new timer
		this.keypress_timer = (function () {
			fieldObj.validate();
		}).delay(1500);
	}
	
});

FormoJS.Field = new Class({
	element: null,
	form:    null,
	request: null,
	data:    null,

	initialize: function (element, form)
	{
		this.element = element;
		this.form = form;
	},
	
	get_block: function () {
		return this.element.getParent().getParent().getParent();
	},
	
	validate: function ()
	{
		var block = this.get_block();
		var self = this;
		
		var data = 'field=' + this.element.name + '&value=' + this.element.value;

		// Don't validate the same data twice
		if (data == this.data)
			return;
		
		// Cancel any currently running validation requests
		if (this.request != null)
			this.request.cancel();

		this.data = data;
		
		this.request = new Request.JSON({
			url: FormoJS.validate_url + 'field',
			data: data,
			
			onRequest: function ()
			{
				block.removeClass('valid');
				block.removeClass('error');
				block.removeClass('server_error');
				block.addClass('validating');
			},
			onComplete: function()
			{
				block.removeClass('validating');
				self.request = null;
			},
			onFailure: function ()
			{
				block.addClass('server_error');
				
				// TODO add more warning next to field
				self.set_message(this.xhr.responseText);
			},
			onSuccess: function (responseJSON, responseText)
			{
				if (responseJSON.status == 'valid')
					block.addClass('valid');
				else if (responseJSON.status == 'invalid')
					block.addClass('error');
				else
					block.addClass('server_error');
				
				self.set_message(responseJSON.message);
			}
		});
		// TODO see if this is needed/works when the client has referrers turned off
		this.request.setHeader('Referer', String(document.location));
		this.request.send();
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

// We can't start until the DOM is available
window.addEvent('domready', function() {
	// Check we have the config.
	if (typeof FormoJS.validate_url == 'undefined')
	{
		// Log to the console if it's available.
		if (typeof console != 'undefined')
			console.log('Validation URL not configured.');
		return;
	}
	
	// Find and initialise all the forms
	$$('.formo_form').each(function (form) {
		new FormoJS.Form(form);
	});
});