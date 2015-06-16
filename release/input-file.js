/*jshint node:true */

'use strict';

var React = require('react');
var Formsy = require('formsy-react');
var ComponentMixin = require('./mixins/component');
var Row = require('./row');
var Icon = require('./icon');

var File = React.createClass({displayName: "File",

    mixins: [Formsy.Mixin, ComponentMixin],

    getInitialState: function() {
        return {
            fileList: []
        };
    },

    changeValue: function(event) {
        var target = event.currentTarget;
        var value = target.value;
        this.setState({fileList: target.files});
        this.setValue(target.files);
        this.props.onChange(this.props.name, target.files, value);
    },

    render: function() {
        var element = this.renderElement();

        if (this.getLayout() === 'elementOnly' || this.props.type === 'hidden') {
            return element;
        }

        var warningIcon = '';
        if (this.showErrors()) {
            warningIcon = (
                React.createElement(Icon, {symbol: "remove", className: "form-control-feedback"})
            );
        }

        return (
            React.createElement(Row, {
                label: this.props.label, 
                required: this.isRequired(), 
                hasErrors: this.showErrors(), 
                layout: this.getLayout(), 
                htmlFor: this.getId()
            }, 
                element, 
                warningIcon, 
                this.renderHelp(), 
                this.renderErrorMessage()
            )
        );
    },

    renderElement: function() {
        return (
            React.createElement("input", React.__spread({}, 
                this.props, 
                {id: this.getId(), 
                type: "file", 
                label: null, 
                onChange: this.changeValue, 
                disabled: this.isFormDisabled() || this.props.disabled})
            )
        );
    }

});

module.exports = File;
