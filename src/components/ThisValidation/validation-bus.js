import Vue from "vue";
import Input from "../ThisInput";
import Select from "../ThisSelect";
import Calendar from "../ThisCalendar";
import TextArea from "../ThisTextarea";
import Autocomplete from "../ThisAutocomplete";
import File from "../ThisFile";
import Radio from "../ThisRadio";
import Checkbox from "../ThisCheckbox";
import utils from "../../utils/utils";

/**
 * Adds validation scope to a input element
 * @returns { A virtual DOM node }
 */
const addValidationScope = function(id, children) {
  children.map(vnode => {
    let types = [
      Input,
      Select,
      Calendar,
      TextArea,
      Autocomplete,
      File,
      Radio,
      Checkbox
    ];
    const options = vnode.componentOptions;
    let isInput = function(element) {
      // checks whether an element is even
      return element === options.Ctor.extendOptions;
    };
    if (
      options && // It's a component that has options
      types.some(isInput) && // you can import a component and check if it's of that type if you'd like
      options.propsData // with prop data
    ) {
      const newNode = vnode;
      if (options.propsData.validationScope === undefined) {
        newNode.componentOptions.propsData.validationScope = id;
      }
      return newNode;
    }
    if (vnode.children) {
      return addValidationScope(id, vnode.children);
    }
    return vnode;
  });
};

export const ThisValidate = {
  install(Vue, options) {
    Vue.component("validation-group", {
      functional: true,
      render: function(createElement, context) {
        addValidationScope(context.props.id, context.children);
        // Transparently pass any attributes, event listeners, children, etc.
        return createElement("div", context.data, context.children);
      }
    });
  }
};

export const ValidationBus = new Vue({
  data() {
    return {
      formIsValid: false,
      formValidators: null,
      errors: []
    };
  },
  computed: {
    isFormValid: function() {
      return this.formIsValid;
    }
  },
  methods: {
    /**
     * Register a validator with specific rules and build the validation scope for all elements
     */
    registerValidator(key, component, rules, scopeName) {
      const element = document.getElementById(key);
      let formId = null;
      let isParent = true;
      if (!element || !element.form) {
        throw new DOMException(
          "Input elements must be inside a form in order to attach validators"
        );
      } else {
        formId = element.form.id;
      }
      const validator = new Validator(element, component, rules);
      if (!utils.check.notNull(this.formValidators)) {
        this.formValidators = new Map();
      }
      if (utils.check.notEmpty(scopeName)) {
        isParent = false;
      }
      if (!this.formValidators.has(formId)) {
        this.formValidators.set(formId, new FormValidator());
      }
      const formValidator = this.formValidators.get(formId);
      if (isParent) {
        formValidator.validators.set(key, validator);
      } else {
        if (!formValidator.childrenScopes.has(scopeName)) {
          formValidator.childrenScopes.set(scopeName, new Scope());
        }
        const childrenScope = this.getScope(formId, scopeName);
        childrenScope.validators.set(key, validator);
      }
    },
    /**
     * Removes a validator
     */
    unregisterValidator(key, formId, scopeName) {
      let childrenScopeName = null;
      let isParent = true;
      if (utils.check.notEmpty(scopeName)) {
        childrenScopeName = scopeName;
        isParent = false;
      }
      if (
        utils.check.notNull(this.formValidators) &&
        this.formValidators.has(formId)
      ) {
        const formValidator = this.formValidators.get(formId);
        if (isParent) {
          formValidator.validators.delete(key);
        } else {
          const childrenScope = formValidator.childrenScopes.get(
            childrenScopeName
          );
          childrenScope.validators.delete(key);
        }
      }
    },
    /**
     * Executes validators within scope range. If no scope specified executes all validators
     * inside the given form.
     */
    validateAll(formId, scopeName) {
      const formValidator = this.formValidators.get(formId);
      let validateAll = true;
      this.errors = [];
      if (utils.check.notEmpty(scopeName)) {
        validateAll = false;
      }
      this.invalidForm();
      if (validateAll) {
        // Executes all validators
        for (let [key, validator] of formValidator.validators) {
          const result = validator.component.validate();
          if (!result.valid) {
            this.errors.push(result.errorMessage);
            this.invalidForm();
          }
        }
        for (let [key, scope] of formValidator.childrenScopes) {
          this.validateScope(scope);
        }
      } else {
        // Executes all validator within a scope
        const scope = formValidator.childrenScopes.get(scopeName);
        this.validateScope(scope);
      }
      if (this.errors.length === 0) {
        this.validForm();
      }
    },
    /**
     * Executes validators within scope range.
     */
    validateScope(scope) {
      if (utils.check.notNull(scope)) {
        for (let [key, validator] of scope.validators) {
          const result = validator.component.validate();
          if (!result.valid) {
            this.errors.push(result.errorMessage);
            this.invalidForm();
          }
        }
      } else {
        throw new DOMException("Validation Bus: provided scope is null");
      }
    },
    /**
     * Retrieves a specific scope for a given form
     */
    getScope(formId, scopeName) {
      if (!this.formValidators.has(formId)) {
        throw new DOMException(
          "Validation Bus: undefined form validator: " + formId
        );
      }
      const formValidator = this.formValidators.get(formId);
      if (!formValidator.childrenScopes.has(scopeName)) {
        throw new DOMException(
          "Validation Bus: undefined scope: " + scopeName + " - form: " + formId
        );
      }

      return formValidator.childrenScopes.get(scopeName);
    },
    /**
     * Retrieves a specific validator for the given scope
     */
    getValidator(key, scopeName) {
      const element = document.getElementById(key);
      let formId = null;
      let isParent = true;
      if (!element || !element.form) {
        console.error(
          "Input elements must be inside a form in order to attach validators"
        );
        return false;
      } else {
        formId = element.form.id;
      }
      const formValidator = this.formValidators.get(formId);
      if (utils.check.notEmpty(scopeName)) {
        isParent = false;
      }
      if (isParent) {
        return formValidator.validators.get(key);
      } else {
        const scope = this.getScope(formId, scopeName);
        return scope.validators.get(key);
      }
    },
    invalidForm() {
      this.formIsValid = false;
    },
    validForm() {
      this.formIsValid = true;
    }
  }
});

/** @class */
export class Validator {
  constructor(element, component, rules) {
    this.element = element;
    this.component = component;
    this.rules = rules;
  }
}

/** @class */
export class Rule {
  constructor(name, message) {
    this.name = name;
    this.message = message;
  }
}

/** @class */
export class Result {
  constructor(valid, errorMessage) {
    this.valid = valid;
    this.errorMessage = errorMessage;
  }
}

/** @class */
export class FormValidator {
  constructor() {
    this.childrenScopes = new Map();
    this.validators = new Map();
  }
}

/** @class */
export class Scope {
  constructor() {
    this.validators = new Map();
  }
}
