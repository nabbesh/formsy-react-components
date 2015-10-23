/*jshint node:true */

'use strict';

var React = require('react');
var Formsy = require('formsy-react');
var ComponentMixin = require('./mixins/component');
var Row = require('./row');

var BACK_KEY = 8;
var ESCAPE_KEY = 27;
var ENTER_KEY = 13;
var LEFT_KEY = 37;
var UP_KEY = 38;
var RIGHT_KEY = 39;
var DOWN_KEY = 40;

/**
 * A component to represent each item in the selected item list
 *
 * @type {*|Function}
 */
var SelectedItemComponent = React.createClass({
    displayName: 'SelectedItemComponent',

    /**
     * Function invoked when the user clicks on the x button of the item
     *
     * @param evt
     */
    handleRemove: function handleRemove(evt) {
        evt.preventDefault();
        this.props.onRemove(this.props.label);
    },
    render: function render() {
        var itemElem;
        if (this.props.listItemType == 'url') {
            var url = this.props.label;
            // Check if the url starts with a valid protocol (i.e http or https)
            var protocolMatch = url.match(/http/);
            if (!protocolMatch || protocolMatch.length === 0) {
                url = 'http://' + url;
            }
            itemElem = React.createElement(
                'a',
                { href: url, className: 'item-link', target: '_blank' },
                url
            );
        } else {
            itemElem = React.createElement(
                'span',
                null,
                this.props.label
            );
        }

        return React.createElement(
            'li',
            null,
            itemElem,
            React.createElement('a', { href: '#', className: 'fa fa-times rm-item-btn', onClick: this.handleRemove })
        );
    }
});

/**
 * A component to represent the list of selected items
 *
 * @type {*|Function}
 */
var SelectedListComponent = React.createClass({
    displayName: 'SelectedListComponent',

    /**
     * Function invoked when the user clicks on the x button of the item
     *
     * @param item
     */
    handleItemRemove: function handleItemRemove(item) {
        this.props.onRemoveItem(item);
    },
    render: function render() {
        // Traverse list of selected items and generate the DOM elements
        var items = [];
        if (this.props.items && typeof this.props.items == 'object' && this.props.items.length > 0) {
            items = this.props.items.map(function (item) {
                var itemKey = 'item' + item;
                return React.createElement(SelectedItemComponent, {
                    key: itemKey,
                    listItemType: this.props.listItemType,
                    label: item,
                    onRemove: this.handleItemRemove });
            }, this);
        }
        // Define the list style
        var listStyleClass = ['common', 'tag'].indexOf(this.props.listStyle) == -1 ? 'selected-list common-style' : this.props.listStyle + '-style selected-list';

        if (this.props.listStyle === 'common') {
            listStyleClass += ' clearfix';
        }

        // Display the list only if there are selected items
        if (items.length == 0) {
            listStyleClass += ' hide';
        }

        return React.createElement(
            'ul',
            { className: listStyleClass },
            items
        );
    }
});

/**
 * A component to represent each suggested item in the item list
 *
 * @type {*|Function}
 */
var SuggestedItemComponent = React.createClass({
    displayName: 'SuggestedItemComponent',

    /**
     * Function invoked when the user selects a suggested item
     *
     * @param evt
     */
    handleSelect: function handleSelect(evt) {
        evt.preventDefault();
        this.props.onSelect(this.props.label);
    },
    render: function render() {
        var itemClass = '';
        if (this.props.isFocused) {
            itemClass = 'focused';
        }
        return React.createElement(
            'li',
            { className: itemClass, onClick: this.handleSelect },
            React.createElement(
                'span',
                null,
                this.props.label
            )
        );
    }
});

/**
 * A component to represent the list of suggested items
 *
 * @type {*|Function}
 */
var SuggestedListComponent = React.createClass({
    displayName: 'SuggestedListComponent',

    /**
     * Function invoked when the user selects a suggested item
     *
     * @param item
     */
    handleSelectSuggestion: function handleSelectSuggestion(item) {
        this.props.onSelectItem(item);
    },
    render: function render() {
        var suggestedItems = [];
        if (typeof this.props.items == 'object') {
            suggestedItems = this.props.items.map(function (item) {
                var itemKey = 'suggestedItem' + item;
                return React.createElement(SuggestedItemComponent, {
                    isFocused: this.props.focusedItem == item,
                    key: itemKey,
                    onSelect: this.handleSelectSuggestion,
                    label: item });
            }, this);
        }

        // Decide if the suggestion list should be displayed
        var suggestionListClass = 'suggested-list clearfix';
        if (suggestedItems.length == 0) {
            suggestionListClass += ' hide';
        }

        return React.createElement(
            'ul',
            { className: suggestionListClass },
            suggestedItems
        );
    }
});

/**
 * A helper component to render items in a list based on user input
 */
var ItemListComponent = React.createClass({
    displayName: 'ItemListComponent',

    mixins: [Formsy.Mixin, ComponentMixin],

    /**
     * Helper function to determine if a variable is null or undefined
     * @param aVar
     * @returns {boolean}
     */
    isDefined: function isDefined(aVar) {
        return aVar !== null && typeof aVar !== 'undefined';
    },
    /**
     * Helper function that reset the error message displayed
     */
    resetError: function resetError() {
        // There was an error, hide it since the user started typing again
        if (this.state.errorMsg && this.state.errorMsg != '') {
            this.setState({
                errorMsg: false
            });
        }
    },
    getDefaultProps: function getDefaultProps() {
        return {
            emptyItemError: "You can't add an empty item",
            itemExistsError: "This item already exists",
            maxNumberOfitemsError: "You can't add more items in the list",
            selectSuggestionError: "Select an item from the suggestion list",
            listStyle: 'common',
            suggestedItems: null
        };
    },
    getInitialState: function getInitialState() {
        this.tagDisplay = this.props.listStyle === 'tag';
        return {
            // The selected items
            items: null,
            errorMsg: false,
            // Variables used when the auto-suggest mode is enabled. Every time the user
            // clicks on the up or down arrow to select a suggested options the following
            // variables are updated
            focusedSuggestedItemLabel: '',
            focusedSuggestedItemIndex: null,
            // The keyword used in the input box
            keyword: '',
            selectedListIsPristine: true
        };
    },
    /**
     * Adds a new item to the list of selected items
     *
     * @param inputField
     */
    addItem: function addItem(inputField) {
        if (!inputField) {
            inputField = React.findDOMNode(this.refs.txtInput);
        }

        var newItem = inputField.value.trim(),
            newState = {
            errorMsg: false
        };

        // Suggestion mode is enabled and the user selected an item from the suggested list
        if (this.autoSuggestEnabled && this.state.focusedSuggestedItemIndex !== null && this.state.focusedSuggestedItemIndex >= 0) {
            newItem = this.filteredSuggestedItems[this.state.focusedSuggestedItemIndex];

            newState = {
                focusedSuggestedItemLabel: '',
                focusedSuggestedItemIndex: null,
                keyword: ''
            };
        }
        // Suggestion mode is enabled but the user hasn't selected anything from the list
        else if (this.autoSuggestEnabled) {
                newState.errorMsg = this.props.selectSuggestionError;
            }

        // Empty item?
        if (newItem === '') {
            newState.errorMsg = this.props.emptyItemError;
        }
        // This item already exists, display an error message
        else if (this.items.indexOf(newItem) >= 0) {
                newState.errorMsg = this.props.itemExistsError;
            }
            // There is a quota in the maximum number of items allowed in the list
            else if (this.props.maxNumberOfItems && this.items.length >= this.props.maxNumberOfItems) {
                    newState.errorMsg = this.props.maxNumberOfitemsError;
                }
                // Valid item, push it at the top of the list
                else if (!newState.errorMsg) {
                        // Copy the existing items in a var and push the new item at the end of the list in case of
                        // a tag list
                        if (this.tagDisplay) {
                            this.items.push(newItem);
                        }
                        // ... or at the start in case of a common list
                        else {
                                this.items.unshift(newItem);
                            }
                    }

        // Indicate that the selected list has been altered
        newState.selectedListIsPristine = false;

        // If it's a tag list, reset the txtBox width
        if (this.tagDisplay) {
            React.findDOMNode(this.refs.txtInput).style.width = '8px';
        }
        // Set the new state
        this.setState(newState, (function () {
            this.setValue(this.items);
            this.props.onChange(this.props.name, this.items);
        }).bind(this));

        // Empty the value on the input field
        inputField.value = '';
    },
    /**
     * Function invoked when the user writes on the input field, gets a list of suggested
     * items and then clicks the down arrow to focus on the next suggestion
     *
     * NOTE: This function is invoked only when the suggestion mode is enabled
     * @see onKeyUp()
     */
    focusOnNextItem: function focusOnNextItem() {
        var newIndex, newLabel;
        // No suggested item is focused
        if (this.state.focusedSuggestedItemIndex === null) {
            newIndex = 0;
        }
        // The last suggested item is focused
        else if (this.state.focusedSuggestedItemIndex == this.filteredSuggestedItems.length - 1) {
                return;
            } else {
                newIndex = this.state.focusedSuggestedItemIndex + 1;
            }
        newLabel = this.filteredSuggestedItems[newIndex];

        this.setState({
            focusedSuggestedItemLabel: newLabel,
            focusedSuggestedItemIndex: newIndex
        });
    },
    /**
     * Function invoked when the user writes on the input field, gets a list of suggested
     * items and then clicks the up arrow to focus on the previous suggestion
     *
     * NOTE: This function is invoked only when the suggestion mode is enabled
     * @see onKeyUp()
     */
    focusOnPrevItem: function focusOnPrevItem() {
        var newIndex, newLabel;
        // No suggested item is focused
        if (!this.state.focusedSuggestedItemIndex) {
            return;
        }
        // The first suggested item is focused
        else if (this.state.focusedSuggestedItemIndex == 0) {
                newIndex = null;
            } else {
                newIndex = this.state.focusedSuggestedItemIndex - 1;
            }
        newLabel = newIndex >= 0 ? this.filteredSuggestedItems[newIndex] : '';
        this.setState({
            focusedSuggestedItemLabel: newLabel,
            focusedSuggestedItemIndex: newIndex
        });
    },
    /**
     * Function invoked when the user clicks on the plus icon to add a new
     * item in the list
     *
     * @param evt
     */
    handleAddItem: function handleAddItem(evt) {
        evt.preventDefault();
        // Add a new item in the list
        if (!this.isElementDisabled()) {
            this.addItem();
        }
    },
    handleBlur: function handleBlur(evt) {
        if (this.autoSuggestEnabled && !this.isDefined(this.state.focusedSuggestedItemIndex)) {
            this.setState({
                hideSuggestionList: true
            });
        }
    },
    handleFocus: function handleFocus(evt) {
        if (this.autoSuggestEnabled && !this.isDefined(this.state.focusedSuggestedItemIndex)) {
            this.setState({
                hideSuggestionList: false
            });
        }
    },
    /**
     * Monitor key down events. The handler mainly added to provent form submission
     * when the user clicks enter while focusing on any form field
     *
     * @param evt
     */
    handleKeyDown: function handleKeyDown(evt) {
        var value = evt.target.value.trim();
        // In case of tag displays, change the width of the input textbox according to
        // input text
        if (this.tagDisplay) {
            var txtBox = React.findDOMNode(this.refs.txtInput),
                measureTxt = React.findDOMNode(this.refs.measureTxt),
                targetW;
            // Set the value of the input in the measurement text and get its width
            measureTxt.innerHTML = value;
            targetW = measureTxt.offsetWidth + 13;
            // Set the width of the textbox
            txtBox.style.width = targetW + 'px';
        }

        if (evt.which === ENTER_KEY) {
            evt.preventDefault();
        }
        // The user hit the back button
        else if (evt.which === BACK_KEY) {
                // Remove the last item added in the list if the following conditions are satisfied:
                // - the tag display is enabled,
                // - there are items in the list,
                // - the input textbox is empty,
                // remove the last item added
                if (this.tagDisplay && this.items && this.items.length > 0 && value.length === 0) this.handleRemoveItem(this.items[this.items.length - 1]);
            }
    },
    /**
     * Monitor key up events. If an enter is clicked add a new item
     * in the list, but apply basic sanity checks including addition of:
     * - empty items (e.g only whitespaces)
     * - existing items
     *
     * @param evt
     */
    handleKeyUp: function handleKeyUp(evt) {
        evt.preventDefault();
        var value = evt.target.value.trim();

        // Reset error messages, if any
        this.resetError();

        // Add the new item to the list
        if (evt.which === ENTER_KEY) {
            this.addItem(evt.target);
        }
        // Navigate to the next item
        else if (evt.which === DOWN_KEY && this.autoSuggestEnabled) {
                this.focusOnNextItem();
            }
            // Navigate to the previous item
            else if (evt.which === UP_KEY && this.autoSuggestEnabled) {
                    this.focusOnPrevItem();
                }
                // Set the new keyword
                else {
                        var newState = {
                            keyword: value
                        };
                        if (this.autoSuggestEnabled) {
                            newState.focusedSuggestedItemIndex = null;
                            newState.focusedSuggestedItemLabel = '';
                        }
                        this.setState(newState);
                    }
    },
    /**
     * Function invoked when the user removes an item from the list
     *
     * @param item
     */
    handleRemoveItem: function handleRemoveItem(item) {
        // Reset any error messages
        this.resetError();

        // Find the item in the list
        var itemPos = this.items.indexOf(item);
        if (itemPos >= 0) {
            var items = this.items;
            items.splice(itemPos, 1);

            // Refresh the list
            this.items = items;

            // Indicate that the selected list has been altered
            this.setState({
                selectedListIsPristine: false
            });
            this.setValue(this.items);
            this.props.onChange(this.props.name, this.items);
        }
    },
    /**
     * Function invoked when the user selects an item from the list of suggestions
     *
     * @param item
     */
    handleSelectSuggestion: function handleSelectSuggestion(item) {
        var newIndex = this.filteredSuggestedItems.indexOf(item),
            newLabel = item;
        this.setState({
            focusedSuggestedItemLabel: newLabel,
            focusedSuggestedItemIndex: newIndex
        }, this.addItem);
    },
    handleTextBoxClick: function handleTextBoxClick(evt) {
        React.findDOMNode(this.refs.txtInput).focus();
    },
    /**
     * Check if the element is disabled
     * @returns {*}
     */
    isElementDisabled: function isElementDisabled() {
        return this.isFormDisabled() || this.props.disabled;
    },
    renderElement: function renderElement() {
        var itemError = this.state.errorMsg,
            focusedSuggestedItemLabel = this.state.focusedSuggestedItemLabel,
            focusedSuggestedItemIndex = this.state.focusedSuggestedItemIndex,
            keyword = this.state.keyword;

        // Initialize the items with the default value as long as the field list of items is pristine
        if (this.state.selectedListIsPristine) {
            this.items = this.getValue() || [];
        }

        // Check if auto-suggest mode is enabled
        this.autoSuggestEnabled = this.props.suggestedItems && this.props.suggestedItems.length >= 0;

        // Traverse list of suggested items and filter if a keyword is available
        var maxNumberOfSuggestions = 8,
            curNumberOfSuggestions = 0;
        this.filteredSuggestedItems = [];
        // note: you need the first condition because null is actually an object
        if (this.props.suggestedItems && typeof this.props.suggestedItems == 'object' && !this.state.hideSuggestionList) {
            this.props.suggestedItems.map(function (item) {
                var patt = new RegExp(keyword, "i");
                if (keyword !== '' && patt.test(item) && curNumberOfSuggestions < maxNumberOfSuggestions) {
                    curNumberOfSuggestions++;
                    this.filteredSuggestedItems.push(item);
                    return item;
                }
            }, this);
        }

        // Decide if an error should be displayed
        var errorClassName = 'error';
        if (itemError == '') {
            errorClassName += ' hide';
        }

        var itemListCompClassName = 'itemlist-component';
        if (this.tagDisplay) {
            itemListCompClassName += ' tag-list';
        }

        var textBoxClassName = '';
        if (!this.tagDisplay) {
            textBoxClassName += 'form-control';
        }

        // If auto-suggest mode is enabled, display an ellipsis icon instead of the plus icon
        var inputAddon;
        if (this.autoSuggestEnabled) {
            inputAddon = React.createElement('i', { className: 'fa fa-ellipsis-h' });
        } else {
            inputAddon = React.createElement('a', { href: '#', className: 'fa fa-plus add-item-btn', onClick: this.handleAddItem });
        }

        // Keep the selected list component in a variable
        var selectedListComponent = React.createElement(SelectedListComponent, {
            items: this.items,
            listItemType: this.props.listItemType,
            listStyle: this.props.listStyle,
            onRemoveItem: this.handleRemoveItem });
        var tagList, commonList;
        // In case of tag lists, the selected list is placed inside the input-group element
        // and precedes the text box. A helper invisible span is also used to properly measure
        // the width of the input text and resize the input text accordingly
        if (this.tagDisplay) {
            tagList = React.createElement(
                'div',
                null,
                selectedListComponent,
                React.createElement('span', { className: 'measure-text', ref: 'measureTxt' })
            );
        } else {
            commonList = selectedListComponent;
        }
        return React.createElement(
            'div',
            { className: itemListCompClassName },
            React.createElement(
                'div',
                { className: 'clearfix input-container' },
                React.createElement(
                    'div',
                    { className: 'input-group', ref: 'inputGroup', onClick: this.handleTextBoxClick },
                    tagList,
                    React.createElement('input', { type: 'text', className: textBoxClassName, ref: 'txtInput', autoComplete: 'off',
                        disabled: this.isElementDisabled(),
                        onKeyDown: this.handleKeyDown,
                        onKeyUp: this.handleKeyUp }),
                    React.createElement(
                        'span',
                        { className: 'input-group-addon' },
                        inputAddon
                    )
                ),
                React.createElement(SuggestedListComponent, {
                    focusedItem: focusedSuggestedItemLabel,
                    items: this.filteredSuggestedItems,
                    onSelectItem: this.handleSelectSuggestion }),
                React.createElement(
                    'div',
                    { className: errorClassName },
                    itemError
                )
            ),
            commonList
        );
    },
    render: function render() {

        if (this.getLayout() === 'elementOnly' || this.props.type === 'hidden') {
            return React.createElement(
                'div',
                null,
                this.renderElement()
            );
        }

        return React.createElement(
            Row,
            {
                label: this.props.label,
                required: this.isRequired(),
                hasErrors: this.showErrors(),
                layout: this.getLayout()
            },
            this.renderElement(),
            this.renderHelp(),
            this.renderErrorMessage()
        );
    }
});

module.exports = ItemListComponent;