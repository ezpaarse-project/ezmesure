(window["ezreporting_bundle_jsonpfunction"] = window["ezreporting_bundle_jsonpfunction"] || []).push([[0],{

/***/ "./lib/reporting.tsx":
/*!***************************!*\
  !*** ./lib/reporting.tsx ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setHttpClient = setHttpClient;
exports.setToasts = setToasts;
exports.setCapabilities = setCapabilities;
exports.capabilities = exports.toasts = exports.httpClient = exports.ms2Str = exports.defaultTask = exports.convertFrequency = void 0;

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({
    value
  }) => value === frequency);
  return freq ? freq.text : 'Error';
};

exports.convertFrequency = convertFrequency;

const defaultTask = dashboardId => ({
  _id: '',
  dashboardId: dashboardId || null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: [],
    createdAt: '',
    print: false
  }
});

exports.defaultTask = defaultTask;

const ms2Str = time => {
  let ms = time;
  let s = Math.floor(ms / 1000);
  ms %= 1000;
  let m = Math.floor(s / 60);
  s %= 60;
  const h = Math.floor(m / 60);
  m %= 60;

  if (h) {
    return `${h}h ${m}m`;
  }

  if (m) {
    return `${m}m ${s}s`;
  }

  if (s) {
    return `${s}s`;
  }

  return `${ms}ms`;
};

exports.ms2Str = ms2Str;
let httpClient;
exports.httpClient = httpClient;

function setHttpClient(http) {
  exports.httpClient = httpClient = http;
}

let toasts;
exports.toasts = toasts;

function setToasts(notifications) {
  exports.toasts = toasts = notifications;
}

let capabilities;
exports.capabilities = capabilities;

function setCapabilities(capa) {
  exports.capabilities = capabilities = capa.ezreporting || {};
}

/***/ }),

/***/ "./public/application.tsx":
/*!********************************!*\
  !*** ./public/application.tsx ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderApp = void 0;

var _react = _interopRequireDefault(__webpack_require__(/*! react */ "react"));

var _reactDom = _interopRequireDefault(__webpack_require__(/*! react-dom */ "react-dom"));

var _app = __webpack_require__(/*! ./components/app */ "./public/components/app.tsx");

var _reporting = __webpack_require__(/*! ../lib/reporting */ "./lib/reporting.tsx");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
const renderApp = ({
  application,
  notifications,
  http
}, {
  navigation
}, {
  appBasePath,
  element
}) => {
  if (!_reporting.httpClient) {
    (0, _reporting.setHttpClient)(http);
  }

  if (!_reporting.toasts) {
    (0, _reporting.setToasts)(notifications.toasts);
  }

  if (!_reporting.capabilities) {
    (0, _reporting.setCapabilities)(application.capabilities);
  }

  _reactDom.default.render( /*#__PURE__*/_react.default.createElement(_app.EzreportingApp, {
    basename: appBasePath,
    navigation: navigation
  }), element);

  return () => _reactDom.default.unmountComponentAtNode(element);
};

exports.renderApp = renderApp;

/***/ }),

/***/ "./public/components/app.tsx":
/*!***********************************!*\
  !*** ./public/components/app.tsx ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EzreportingApp = void 0;

var _react = _interopRequireWildcard(__webpack_require__(/*! react */ "react"));

var _react2 = __webpack_require__(/*! @kbn/i18n/react */ "@kbn/i18n/react");

var _reactRouterDom = __webpack_require__(/*! react-router-dom */ "react-router-dom");

var _eui = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");

var _common = __webpack_require__(/*! ../../common */ "./common/index.ts");

var _table = __webpack_require__(/*! ./table */ "./public/components/table.tsx");

var _edit = __webpack_require__(/*! ./flyout/edit */ "./public/components/flyout/edit.tsx");

var _history = __webpack_require__(/*! ./flyout/history */ "./public/components/flyout/history.tsx");

var _reporting = __webpack_require__(/*! ../../lib/reporting */ "./lib/reporting.tsx");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class EzreportingApp extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "componentDidMount", () => {
      _reporting.httpClient.get('/api/ezreporting/tasks').then(res => {
        this.setState({
          tasks: res.tasks,
          dashboards: res.dashboards,
          frequencies: res.frequencies,
          reportingName: res.reportingName
        });
      }).catch(err => {
        if (err.code === 403) {
          this.setState({
            accessDenied: true
          });
        }

        return _reporting.toasts.addDanger({
          title: 'Error',
          text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
            id: "ezReporting.errorOccured",
            defaultMessage: "An error occurred while loading the data."
          })
        });
      });
    });

    _defineProperty(this, "editTaskHandler", task => {
      if (_reporting.capabilities.edit) {
        const body = JSON.stringify({
          dashboardId: task.dashboardId,
          frequency: task.reporting.frequency,
          emails: task.reporting.emails,
          print: task.reporting.print
        });
        return _reporting.httpClient.patch(`/api/ezreporting/tasks/${task._id}`, {
          body
        }).then(() => {
          const index = this.state.tasks.findIndex(({
            _id
          }) => _id === task._id);
          const tasks = this.state.tasks;
          tasks[index] = task;
          this.setState({
            tasks
          });

          _reporting.toasts.addSuccess({
            title: 'Success',
            text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
              id: "ezReporting.editingSuccess",
              defaultMessage: "Task edited successfully."
            })
          });

          (0, _edit.closeFlyOut)();
          this.forceUpdate();
        });
      }
    });

    _defineProperty(this, "saveTaskHandler", task => {
      if (_reporting.capabilities.save) {
        const tasks = this.state.tasks;
        const body = JSON.stringify({
          dashboardId: task.dashboardId,
          frequency: task.reporting.frequency,
          emails: task.reporting.emails,
          print: task.reporting.print
        });
        return _reporting.httpClient.post('/api/ezreporting/tasks', {
          body
        }).then(res => {
          task._id = res._id;
          task.reporting.createdAt = res.createdAt;
          tasks.push(task);
          this.setState({
            tasks
          });

          _reporting.toasts.addSuccess({
            title: 'Success',
            text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
              id: "ezreporting.editingSuccess",
              defaultMessage: "Task edited successfully."
            })
          });

          (0, _edit.closeFlyOut)();
          this.forceUpdate();
        });
      }
    });

    _defineProperty(this, "removeTaskHandler", task => {
      if (_reporting.capabilities.delete) {
        if (task) {
          _reporting.httpClient.delete(`/api/ezreporting/tasks/${task._id}`).then(() => {
            const tasks = this.state.tasks.filter(({
              _id
            }) => _id !== task._id);
            this.setState({
              tasks
            });

            _reporting.toasts.addSuccess({
              title: 'Success',
              text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
                id: "ezReporting.removalSuccess",
                defaultMessage: "Task removed successfully."
              })
            });

            this.forceUpdate();
          }).catch(() => {
            _reporting.toasts.addDanger({
              title: 'Error',
              text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
                id: "ezReporting.removalError",
                defaultMessage: "An error occurred during the removal of the task."
              })
            });
          });
        }

        if (!task._id) {
          _reporting.toasts.addDanger({
            title: 'Error',
            text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
              id: "ezReporting.removalError",
              defaultMessage: "An error occurred during the removal of the task."
            })
          });
        }
      }
    });

    _defineProperty(this, "downloadReport", taskId => {
      if (_reporting.capabilities.save && taskId) {
        return _reporting.httpClient.get(`/api/ezreporting/tasks/${taskId}/download`);
      }
    });

    this.state = {
      tasks: [],
      dashboards: [],
      frequencies: [],
      reportingName: 'Reporting',
      accessDenied: false
    };
  }

  render() {
    const {
      basename,
      navigation
    } = this.props;
    const {
      tasks,
      dashboards,
      frequencies,
      reportingName,
      accessDenied
    } = this.state;

    if (accessDenied) {
      const defaultMsg = `
        You are not authorized to access Reporting.
        To use Reporting management, you need the privileges granted by the \`reporting\` role.
      `;
      return /*#__PURE__*/_react.default.createElement(_eui.EuiEmptyPrompt, {
        iconType: "reportingApp",
        title: /*#__PURE__*/_react.default.createElement("h2", null, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.accessDeniedTitle",
          defaultMessage: "Access denied"
        })),
        body: /*#__PURE__*/_react.default.createElement(_react.Fragment, null, /*#__PURE__*/_react.default.createElement("p", null, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.accessDenied",
          defaultMessage: defaultMsg
        }), ","))
      });
    }

    return /*#__PURE__*/_react.default.createElement(_reactRouterDom.BrowserRouter, {
      basename: basename
    }, /*#__PURE__*/_react.default.createElement(_edit.EzreportingTaskEditFlyout, {
      dashboards: dashboards,
      frequencies: frequencies,
      editTaskHandler: this.editTaskHandler,
      saveTaskHandler: this.saveTaskHandler
    }), /*#__PURE__*/_react.default.createElement(_history.EzreportingHistoryFlyout, null), /*#__PURE__*/_react.default.createElement(_react2.I18nProvider, null, /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(navigation.ui.TopNavMenu, {
      appName: _common.PLUGIN_ID,
      showSearchBar: false
    }), /*#__PURE__*/_react.default.createElement(_eui.EuiPage, {
      restrictWidth: "1000px"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiPageBody, null, /*#__PURE__*/_react.default.createElement(_eui.EuiPageContent, null, /*#__PURE__*/_react.default.createElement(_eui.EuiPageContentHeader, null, /*#__PURE__*/_react.default.createElement(_eui.EuiPageContentHeaderSection, null, /*#__PURE__*/_react.default.createElement(_eui.EuiTitle, null, /*#__PURE__*/_react.default.createElement("h2", null, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      id: "ezreporting.title",
      defaultMessage: "{name}",
      values: {
        name: `${_common.PLUGIN_NAME} ${_common.PLUGIN_APP_NAME}`
      }
    })))), /*#__PURE__*/_react.default.createElement(_eui.EuiPageContentHeaderSection, null, /*#__PURE__*/_react.default.createElement(_eui.EuiButton, {
      fill: true,
      iconType: "plusInCircle",
      isDisabled: dashboards.length > 0 ? false : true,
      onClick: () => dashboards.length > 0 ? (0, _edit.openFlyOut)(null, false) : null
    }, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      id: "ezreporting.createNewTask",
      defaultMessage: "New reporting task"
    })))), /*#__PURE__*/_react.default.createElement(_eui.EuiPageContentBody, null, /*#__PURE__*/_react.default.createElement(_table.EzreportingTable, {
      tasks: tasks,
      dashboards: dashboards,
      frequencies: frequencies,
      removeTaskHandler: this.removeTaskHandler,
      downloadReport: this.downloadReport
    }))))))));
  }

}

exports.EzreportingApp = EzreportingApp;

/***/ }),

/***/ "./public/components/flyout/edit.tsx":
/*!*******************************************!*\
  !*** ./public/components/flyout/edit.tsx ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openFlyOut = openFlyOut;
exports.closeFlyOut = closeFlyOut;
exports.EzreportingTaskEditFlyout = void 0;

var _react = _interopRequireWildcard(__webpack_require__(/*! react */ "react"));

var _eui = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");

var _lodash = __webpack_require__(/*! lodash */ "../../node_modules/lodash/index.js");

var _react2 = __webpack_require__(/*! @kbn/i18n/react */ "@kbn/i18n/react");

var _i18n = __webpack_require__(/*! @kbn/i18n */ "@kbn/i18n");

var _reporting = __webpack_require__(/*! ../../../lib/reporting */ "./lib/reporting.tsx");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let openFlyOutHandler;

function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let closeFlyOutHandler;

function closeFlyOut() {
  closeFlyOutHandler();
}

class EzreportingTaskEditFlyout extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "open", (dashboard, edit) => {
      const currentTask = JSON.parse(JSON.stringify(dashboard || (0, _reporting.defaultTask)(this.props.dashboards[0].id)));
      const currentFrequency = (0, _lodash.get)(currentTask, 'reporting.frequency');
      const frequency = this.props.frequencies.find(f => f.value === currentFrequency);
      let receivers = (0, _lodash.get)(currentTask, 'reporting.emails', []);

      if (typeof receivers === 'string') {
        receivers = receivers.split(',').map(e => e.trim());
      }

      if (!frequency && this.props.frequencies.length > 0) {
        // If the task frequency doesn't exist anymore, auto-select first frequency
        (0, _lodash.set)(currentTask, 'reporting.frequency', this.props.frequencies[0].value);
      }

      this.setState({
        isFlyoutVisible: true,
        currentTask,
        edit,
        receivers,
        email: '',
        mailErrorMessages: [],
        dashboardErrorMessages: []
      });
    });

    _defineProperty(this, "close", () => {
      this.setState({
        isFlyoutVisible: false
      });
    });

    _defineProperty(this, "onChangeDashboard", selectedDashboards => {
      const dashboard = selectedDashboards[0];
      const currentTask = { ...this.state.currentTask
      };
      currentTask.dashboardId = dashboard && dashboard.value;
      const dashboardErrorMessages = [];

      if (!currentTask.dashboardId) {
        dashboardErrorMessages.push(_i18n.i18n.translate('ezReporting.pleaseSelectDashboard', {
          defaultMessage: 'Please select a dashboard'
        }));
      }

      this.setState({
        currentTask,
        dashboardErrorMessages
      });
    });

    _defineProperty(this, "onChangeFrequency", event => {
      const currentTask = { ...this.state.currentTask
      };
      currentTask.reporting.frequency = event.target.value;
      this.setState({
        currentTask
      });
    });

    _defineProperty(this, "onChangeEmail", event => {
      this.setState({
        email: event.target.value
      });
    });

    _defineProperty(this, "onChangeLayout", event => {
      const currentTask = { ...this.state.currentTask
      };
      currentTask.reporting.print = event.target.checked;
      this.setState({
        currentTask
      });
    });

    _defineProperty(this, "addReceiver", async event => {
      event.preventDefault();
      const {
        email,
        receivers
      } = this.state;

      try {
        const body = JSON.stringify({
          email
        });
        const resp = await _reporting.httpClient.post('/api/ezreporting/email', {
          body
        });
        const exists = receivers.includes(email);
        this.setState({
          email: '',
          mailErrorMessages: [],
          receivers: exists ? receivers : receivers.concat([email])
        });
      } catch (error) {
        this.setState({
          mailErrorMessages: [_i18n.i18n.translate('ezReporting.pleaseEnterValidEmail', {
            defaultMessage: 'Please enter a valid email address'
          })]
        });
      }
    });

    _defineProperty(this, "removeReceiver", email => {
      this.setState({
        receivers: this.state.receivers.filter(r => r !== email)
      });
    });

    _defineProperty(this, "saveOrUpdate", () => {
      if (_reporting.capabilities.save) {
        const {
          edit,
          currentTask,
          receivers
        } = this.state;
        (0, _lodash.set)(currentTask, 'reporting.emails', receivers);

        if (edit) {
          return this.props.editTaskHandler(currentTask).catch(err => _reporting.toasts.addDanger({
            title: 'Error',
            text: (0, _lodash.get)(err, 'data.error', 'Error')
          }));
        }

        return this.props.saveTaskHandler(currentTask).catch(err => _reporting.toasts.addDanger({
          title: 'Error',
          text: (0, _lodash.get)(err, 'data.error', 'Error')
        }));
      }
    });

    this.state = {
      isFlyoutVisible: false,
      edit: false,
      currentTask: null,
      email: '',
      receivers: [],
      mailErrorMessages: [],
      dashboardErrorMessages: []
    };
    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  render() {
    const {
      isFlyoutVisible,
      currentTask,
      edit,
      mailErrorMessages,
      dashboardErrorMessages,
      receivers
    } = this.state;
    const {
      dashboards,
      frequencies
    } = this.props;

    const flytOut = /*#__PURE__*/_react.default.createElement(_eui.EuiFlyout, {
      onClose: this.close,
      size: "m"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutHeader, {
      hasBorder: true
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexGroup, {
      alignItems: "center"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexItem, null, /*#__PURE__*/_react.default.createElement(_eui.EuiTitle, {
      size: "s"
    }, /*#__PURE__*/_react.default.createElement("h3", {
      id: "flyoutTitle"
    }, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      defaultMessage: "Log event document details",
      id: "xpack.infra.logFlyout.flyoutTitle"
    })))), /*#__PURE__*/_react.default.createElement(_eui.EuiFlexItem, {
      grow: false
    }, "lortem"))), /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutBody, null, "lorem"));

    const dashboardList = dashboards.map(dashboard => ({
      value: dashboard.id,
      label: dashboard.name
    }));
    const invalidMail = mailErrorMessages.length > 0;
    const invalidDashboard = dashboardErrorMessages.length > 0;
    const invalidForm = invalidDashboard || receivers.length === 0;
    let saveBtn;

    if (_reporting.capabilities.save) {
      saveBtn = /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
        fullWidth: true
      }, /*#__PURE__*/_react.default.createElement(_eui.EuiButton, {
        fill: true,
        iconType: "save",
        type: "submit",
        onClick: () => this.saveOrUpdate(),
        disabled: invalidForm,
        fullWidth: true
      }, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.save",
        defaultMessage: "Save"
      })));
    }

    if (!isFlyoutVisible) {
      return /*#__PURE__*/_react.default.createElement(_react.Fragment, null);
    }

    let title;

    if (edit) {
      title = /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.editingTask",
        defaultMessage: "Editing a reporting task"
      });
    } else {
      title = /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.creatingTask",
        defaultMessage: "Creating a reporting task"
      });
    }

    const receiverItems = receivers.map((email, index) => /*#__PURE__*/_react.default.createElement(_eui.EuiListGroupItem, {
      key: index,
      label: email,
      extraAction: {
        iconType: 'trash',
        iconSize: 's',
        'aria-label': `remove receiver ${email}`,
        onClick: () => {
          this.removeReceiver(email);
        }
      }
    }));
    let receiversList;

    if (receiverItems.length > 0) {
      receiversList = /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
        fullWidth: true
      }, /*#__PURE__*/_react.default.createElement(_eui.EuiListGroup, {
        maxWidth: false,
        bordered: true
      }, receiverItems));
    }

    const selectedDashboards = dashboardList.filter(d => d.value === currentTask.dashboardId);

    const flyOutContent = /*#__PURE__*/_react.default.createElement(_eui.EuiForm, null, /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
      fullWidth: true,
      label: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.dashboard",
        defaultMessage: "Dashboard"
      }),
      isInvalid: invalidDashboard,
      error: dashboardErrorMessages
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiComboBox, {
      fullWidth: true,
      placeholder: _i18n.i18n.translate('ezReporting.selectDashboard', {
        defaultMessage: 'Select a dashboard'
      }),
      singleSelection: {
        asPlainText: true
      },
      options: dashboardList,
      selectedOptions: selectedDashboards,
      onChange: this.onChangeDashboard,
      isClearable: true,
      isInvalid: invalidDashboard
    })), /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
      fullWidth: true,
      label: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.frequency",
        defaultMessage: "Frequency"
      })
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiSelect, {
      fullWidth: true,
      options: frequencies,
      value: currentTask.reporting.frequency,
      "aria-label": /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.frequency",
        defaultMessage: "Frequency"
      }),
      onChange: this.onChangeFrequency
    })), /*#__PURE__*/_react.default.createElement(_eui.EuiSpacer, {
      size: "m"
    }), /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this.addReceiver
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexGroup, null, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexItem, null, /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
      label: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.receiversEmails",
        defaultMessage: "Receivers' email addresses"
      }),
      fullWidth: true,
      isInvalid: invalidMail,
      error: mailErrorMessages
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFieldText, {
      fullWidth: true,
      placeholder: "Email",
      value: this.state.email,
      onChange: this.onChangeEmail
    }))), /*#__PURE__*/_react.default.createElement(_eui.EuiFlexItem, {
      grow: false
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
      hasEmptyLabelSpace: true
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiButton, {
      iconType: "plusInCircle",
      type: "submit"
    }, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      id: "ezReporting.add",
      defaultMessage: "Add"
    })))))), /*#__PURE__*/_react.default.createElement(_eui.EuiSpacer, {
      size: "m"
    }), receiversList, /*#__PURE__*/_react.default.createElement(_eui.EuiFormRow, {
      fullWidth: true
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiCheckbox, {
      id: "optimize-checkbox",
      checked: currentTask.reporting.print,
      label: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
        id: "ezReporting.optimizedForPrinting",
        defaultMessage: "Optimized for printing"
      }),
      onChange: this.onChangeLayout
    })), saveBtn);

    return /*#__PURE__*/_react.default.createElement(_eui.EuiFlyout, {
      onClose: this.close,
      size: "m",
      "aria-labelledby": "flyoutSmallTitle"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutHeader, {
      hasBorder: true
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiTitle, {
      size: "m"
    }, /*#__PURE__*/_react.default.createElement("h2", null, title))), /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutBody, null, flyOutContent));
  }

}

exports.EzreportingTaskEditFlyout = EzreportingTaskEditFlyout;

/***/ }),

/***/ "./public/components/flyout/history.tsx":
/*!**********************************************!*\
  !*** ./public/components/flyout/history.tsx ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openFlyOut = openFlyOut;
exports.closeFlyOut = closeFlyOut;
exports.EzreportingHistoryFlyout = void 0;

var _react = _interopRequireWildcard(__webpack_require__(/*! react */ "react"));

var _eui = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");

var _react2 = __webpack_require__(/*! @kbn/i18n/react */ "@kbn/i18n/react");

var _i18n = __webpack_require__(/*! @kbn/i18n */ "@kbn/i18n");

var _reporting = __webpack_require__(/*! ../../../lib/reporting */ "./lib/reporting.tsx");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let openFlyOutHandler;

function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let closeFlyOutHandler;

function closeFlyOut() {
  closeFlyOutHandler();
}

class EzreportingHistoryFlyout extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "showDetails", historyItem => {
      const expandedRows = { ...this.state.expandedRows
      };
      const {
        logs = []
      } = historyItem;
      const columns = [{
        field: 'date',
        name: _i18n.i18n.translate('ezReporting.date', {
          defaultMessage: 'Date'
        }),
        align: 'left',
        dataType: 'date',
        width: '180px'
      }, {
        field: 'type',
        name: _i18n.i18n.translate('ezReporting.type', {
          defaultMessage: 'Type'
        }),
        width: '80px',
        render: type => {
          const colors = {
            error: 'danger',
            info: 'primary',
            warn: 'warning'
          };
          return /*#__PURE__*/_react.default.createElement(_eui.EuiBadge, {
            color: colors[type] || 'hollow'
          }, type);
        }
      }, {
        field: 'message',
        name: _i18n.i18n.translate('ezReporting.message', {
          defaultMessage: 'Message'
        }),
        align: 'left'
      }];
      expandedRows[historyItem.id] = /*#__PURE__*/_react.default.createElement(_react.Fragment, null, /*#__PURE__*/_react.default.createElement(_eui.EuiBasicTable, {
        items: logs,
        columns: columns
      }));
      this.setState({
        expandedRows
      });
    });

    _defineProperty(this, "hideDetails", historyId => {
      const expandedRows = { ...this.state.expandedRows
      };
      delete expandedRows[historyId];
      this.setState({
        expandedRows
      });
    });

    _defineProperty(this, "toggleDetails", historyItem => {
      const rowsExpanded = { ...this.state.expandedRows
      };

      if (rowsExpanded[historyItem.id]) {
        this.hideDetails(historyItem.id);
      } else {
        this.showDetails(historyItem);
      }
    });

    _defineProperty(this, "refresh", async () => {
      const {
        taskId,
        expandedRows
      } = this.state;
      this.setState({
        refreshing: true
      });
      let historyItems;

      try {
        const resp = await _reporting.httpClient.get(`/api/ezreporting/tasks/${taskId}/history`);
        historyItems = resp;
      } catch (e) {
        _reporting.toasts.addDanger({
          title: 'Error',
          text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
            id: "ezReporting.historyError",
            defaultMessage: "An error occurred while loading the history."
          })
        });
      }

      historyItems = historyItems || []; // Refresh history logs

      Object.keys(expandedRows).forEach(historyId => {
        const historyItem = historyItems.find(item => item.id === historyId);

        if (historyItem) {
          this.showDetails(historyItem);
        } else {
          this.hideDetails(historyId);
        }
      });
      this.setState({
        refreshing: false,
        historyItems
      });
    });

    _defineProperty(this, "open", async taskId => {
      if (!taskId || !_reporting.capabilities.show) {
        return;
      }

      this.setState({
        taskId,
        historyItems: [],
        isFlyoutVisible: true
      }, this.refresh);
    });

    _defineProperty(this, "close", () => {
      this.setState({
        isFlyoutVisible: false
      });
    });

    _defineProperty(this, "onTableChange", ({
      page = {}
    }) => {
      const {
        index: pageIndex,
        size: pageSize
      } = page;
      this.setState({
        pageIndex,
        pageSize
      });
    });

    this.state = {
      taskId: null,
      refreshing: false,
      isFlyoutVisible: false,
      historyItems: [],
      pageIndex: 0,
      pageSize: 10,
      expandedRows: {}
    };
    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  render() {
    const {
      refreshing,
      isFlyoutVisible,
      historyItems,
      expandedRows,
      pageIndex,
      pageSize
    } = this.state;

    if (!isFlyoutVisible) {
      return /*#__PURE__*/_react.default.createElement(_react.Fragment, null);
    }

    const columns = [{
      field: 'startTime',
      name: _i18n.i18n.translate('ezReporting.date', {
        defaultMessage: 'Date'
      }),
      sortable: true,
      dataType: 'date',
      align: 'left'
    }, {
      field: 'status',
      name: _i18n.i18n.translate('ezReporting.status', {
        defaultMessage: 'Status'
      }),
      sortable: true,
      align: 'left',
      width: '140px',
      render: status => {
        switch (status) {
          case 'error':
            return /*#__PURE__*/_react.default.createElement(_eui.EuiHealth, {
              color: "danger"
            }, _i18n.i18n.translate('ezReporting.error', {
              defaultMessage: 'Error'
            }));

          case 'completed':
            return /*#__PURE__*/_react.default.createElement(_eui.EuiHealth, {
              color: "success"
            }, _i18n.i18n.translate('ezReporting.completed', {
              defaultMessage: 'Completed'
            }));

          case 'pending':
            return /*#__PURE__*/_react.default.createElement(_eui.EuiHealth, {
              color: "primary"
            }, _i18n.i18n.translate('ezReporting.pending', {
              defaultMessage: 'Pending'
            }));

          case 'ongoing':
            return /*#__PURE__*/_react.default.createElement(_eui.EuiHealth, {
              color: "primary"
            }, _i18n.i18n.translate('ezReporting.ongoing', {
              defaultMessage: 'Ongoing'
            }));

          default:
            return /*#__PURE__*/_react.default.createElement(_eui.EuiHealth, {
              color: "subdued"
            }, _i18n.i18n.translate('ezReporting.unknown', {
              defaultMessage: 'Unknown'
            }));
        }
      }
    }, {
      field: 'executionTime',
      name: _i18n.i18n.translate('ezReporting.executionTime', {
        defaultMessage: 'Execution time'
      }),
      sortable: true,
      align: 'right',
      width: '140px',
      render: executionTime => {
        return (0, _reporting.ms2Str)(executionTime);
      }
    }, {
      align: 'right',
      width: '40px',
      isExpander: true,
      render: item => /*#__PURE__*/_react.default.createElement(_eui.EuiButtonIcon, {
        onClick: () => this.toggleDetails(item),
        "aria-label": expandedRows[item.id] ? 'Collapse' : 'Expand',
        iconType: expandedRows[item.id] ? 'arrowUp' : 'arrowDown'
      })
    }];
    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: historyItems.length,
      pageSizeOptions: [10, 20, 30],
      hidePerPageOptions: false
    };
    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, historyItems.length);
    return /*#__PURE__*/_react.default.createElement(_eui.EuiFlyout, {
      onClose: this.close,
      size: "m",
      "aria-labelledby": "flyoutSmallTitle"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutHeader, {
      hasBorder: true
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiTitle, {
      size: "m"
    }, /*#__PURE__*/_react.default.createElement("h2", null, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      id: "ezReporting.history",
      defaultMessage: "History"
    })))), /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutBody, null, /*#__PURE__*/_react.default.createElement(_eui.EuiBasicTable, {
      items: historyItems.slice(startIndex, endIndex),
      itemId: "id",
      itemIdToExpandedRowMap: this.state.expandedRows,
      isExpandable: true,
      columns: columns,
      pagination: pagination,
      onChange: this.onTableChange
    })), /*#__PURE__*/_react.default.createElement(_eui.EuiFlyoutFooter, null, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexGroup, {
      justifyContent: "flexEnd"
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiFlexItem, {
      grow: false
    }, /*#__PURE__*/_react.default.createElement(_eui.EuiButton, {
      iconType: "refresh",
      onClick: this.refresh,
      isLoading: refreshing,
      fill: true
    }, /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
      id: "ezReporting.refresh",
      defaultMessage: "Refresh"
    }))))));
  }

}

exports.EzreportingHistoryFlyout = EzreportingHistoryFlyout;

/***/ }),

/***/ "./public/components/table.tsx":
/*!*************************************!*\
  !*** ./public/components/table.tsx ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EzreportingTable = void 0;

var _react = _interopRequireWildcard(__webpack_require__(/*! react */ "react"));

var _i18n = __webpack_require__(/*! @kbn/i18n */ "@kbn/i18n");

var _react2 = __webpack_require__(/*! @kbn/i18n/react */ "@kbn/i18n/react");

var _eui = __webpack_require__(/*! @elastic/eui */ "@elastic/eui");

var _moment = _interopRequireDefault(__webpack_require__(/*! moment */ "moment"));

var _edit = __webpack_require__(/*! ./flyout/edit */ "./public/components/flyout/edit.tsx");

var _history = __webpack_require__(/*! ./flyout/history */ "./public/components/flyout/history.tsx");

var _reporting = __webpack_require__(/*! ../../lib/reporting */ "./lib/reporting.tsx");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class EzreportingTable extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "toggleDetails", item => {
      const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap
      };

      if (itemIdToExpandedRowMap[item._id]) {
        delete itemIdToExpandedRowMap[item._id];
        return this.setState({
          itemIdToExpandedRowMap
        });
      }

      const {
        reporting
      } = item;
      const receivers = Array.isArray(reporting.emails) ? reporting.emails.join(', ') : reporting.emails;
      const listItems = [{
        title: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.receiversEmails",
          defaultMessage: "Receivers' email addresses"
        }),
        description: receivers
      }, {
        title: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.nextReport",
          defaultMessage: "Next report"
        }),
        description: reporting.runAt ? (0, _moment.default)(reporting.runAt).format('YYYY-MM-DD hh:mm') : 'N/A'
      }, {
        title: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.createdAt",
          defaultMessage: "Creation date"
        }),
        description: reporting.createdAt ? (0, _moment.default)(reporting.createdAt).format('YYYY-MM-DD') : 'N/A'
      }];
      itemIdToExpandedRowMap[item._id] = /*#__PURE__*/_react.default.createElement(_eui.EuiDescriptionList, {
        listItems: listItems
      });
      return this.setState({
        itemIdToExpandedRowMap
      });
    });

    _defineProperty(this, "onTableChange", ({
      page = {}
    }) => {
      const {
        index: pageIndex,
        size: pageSize
      } = page;
      this.setState({
        pageIndex,
        pageSize
      });
    });

    this.state = {
      itemIdToExpandedRowMap: {},
      pageIndex: 0,
      pageSize: 10
    };
  }

  render() {
    const {
      pageIndex,
      pageSize,
      itemIdToExpandedRowMap
    } = this.state;
    const {
      tasks,
      dashboards,
      frequencies
    } = this.props;
    const actions = [];

    if (_reporting.capabilities.edit) {
      actions.push({
        name: _i18n.i18n.translate('ezReporting.edit', {
          defaultMessage: 'Edit'
        }),
        description: _i18n.i18n.translate('ezReporting.edit', {
          defaultMessage: 'Edit'
        }),
        icon: 'pencil',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return (0, _edit.openFlyOut)(el, true);
          }

          return _reporting.toasts.addDanger({
            title: 'Error',
            text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
              id: "ezReporting.dashboardNotFound",
              values: {
                DASHBOARD_ID: el.dashboardId
              },
              defaultMessage: "Dashboard nof found or remove (id: {DASHBOARD_ID})"
            })
          });
        }
      });
    }

    if (_reporting.capabilities.save) {
      actions.push({
        name: _i18n.i18n.translate('ezReporting.generate', {
          defaultMessage: 'Generate'
        }),
        description: _i18n.i18n.translate('ezReporting.generate', {
          defaultMessage: 'Generate'
        }),
        icon: 'importAction',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return this.props.downloadReport(el._id).then(() => {
              return _reporting.toasts.addInfo({
                title: 'Information',
                text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
                  id: "ezReporting.generated",
                  defaultMessage: "Your report will be sent to you by email"
                })
              });
            }).catch(() => {
              return _reporting.toasts.addDanger({
                title: 'Error',
                text: /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
                  id: "ezReporting.generationError",
                  defaultMessage: "An error occurred while downloading report."
                })
              });
            });
          }
        }
      });
    }

    if (_reporting.capabilities.show) {
      actions.push({
        name: _i18n.i18n.translate('ezReporting.history', {
          defaultMessage: 'History'
        }),
        description: _i18n.i18n.translate('ezReporting.history', {
          defaultMessage: 'History'
        }),
        icon: 'clock',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            (0, _history.openFlyOut)(el._id, false);
          }
        }
      });
    }

    if (_reporting.capabilities.delete) {
      actions.push({
        name: _i18n.i18n.translate('ezReporting.delete', {
          defaultMessage: 'Delete'
        }),
        description: _i18n.i18n.translate('ezReporting.delete', {
          defaultMessage: 'Delete'
        }),
        icon: 'trash',
        type: 'icon',
        color: 'danger',
        onClick: el => {
          this.props.removeTaskHandler(el);
        }
      });
    }

    const columns = [{
      name: _i18n.i18n.translate('ezReporting.dashboard', {
        defaultMessage: 'Dashboard'
      }),
      description: _i18n.i18n.translate('ezReporting.dashboardName', {
        defaultMessage: 'Dashboard name'
      }),
      align: 'left',
      render: ({
        dashboardId,
        reporting
      }) => {
        if (dashboardId) {
          const dashboard = dashboards.find(({
            id
          }) => id === dashboardId);

          if (dashboard) {
            if (reporting.print) {
              const content = /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
                id: "ezReporting.optimizedForPrinting",
                defaultMessage: "Optimized for printing"
              });

              return /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement(_eui.EuiLink, {
                href: `kibana#/dashboard/${dashboardId}`
              }, dashboard.name), " ", ' ', /*#__PURE__*/_react.default.createElement(_eui.EuiToolTip, {
                position: "right",
                content: content
              }, /*#__PURE__*/_react.default.createElement(_eui.EuiText, null, "\uD83D\uDDB6")));
            }

            return /*#__PURE__*/_react.default.createElement(_eui.EuiLink, {
              href: `kibana#/dashboard/${dashboardId}`
            }, dashboard.name);
          }
        }

        return /*#__PURE__*/_react.default.createElement(_eui.EuiTextColor, {
          color: "warning"
        }, /*#__PURE__*/_react.default.createElement(_eui.EuiIcon, {
          type: "alert"
        }), /*#__PURE__*/_react.default.createElement(_react2.FormattedMessage, {
          id: "ezReporting.dashboardNotFound",
          values: {
            DASHBOARD_ID: dashboardId
          },
          defaultMessage: "Dashboard nof found or remove (id: {DASHBOARD_ID})"
        }));
      }
    }, {
      name: _i18n.i18n.translate('ezReporting.frequency', {
        defaultMessage: 'Frequency'
      }),
      description: _i18n.i18n.translate('ezReporting.frequency', {
        defaultMessage: 'Frequency'
      }),
      render: ({
        reporting
      }) => (0, _reporting.convertFrequency)(frequencies, reporting.frequency),
      align: 'center'
    }, {
      name: _i18n.i18n.translate('ezReporting.sentAt', {
        defaultMessage: 'Last sent'
      }),
      description: _i18n.i18n.translate('ezReporting.sentAt', {
        defaultMessage: 'Last sent'
      }),
      align: 'center',
      render: ({
        reporting
      }) => {
        if (reporting.sentAt && reporting.sentAt !== '1970-01-01T12:00:00.000Z') {
          return (0, _moment.default)(reporting.sentAt).format('YYYY-MM-DD');
        }

        return '-';
      }
    }, {
      actions,
      align: 'right',
      width: '32px'
    }, {
      align: 'right',
      width: '40px',
      isExpander: true,
      render: item => /*#__PURE__*/_react.default.createElement(_eui.EuiButtonIcon, {
        onClick: () => this.toggleDetails(item),
        "aria-label": itemIdToExpandedRowMap[item._id] ? 'Collapse' : 'Expand',
        iconType: itemIdToExpandedRowMap[item._id] ? 'arrowUp' : 'arrowDown'
      })
    }];
    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: tasks.length,
      pageSizeOptions: [10, 20, 30],
      hidePerPageOptions: false
    };
    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, tasks.length);
    return /*#__PURE__*/_react.default.createElement(_eui.EuiBasicTable, {
      items: tasks.slice(startIndex, endIndex),
      itemId: "_id",
      itemIdToExpandedRowMap: itemIdToExpandedRowMap,
      isExpandable: true,
      hasActions: true,
      columns: columns,
      pagination: pagination,
      onChange: this.onTableChange
    });
  }

}

exports.EzreportingTable = EzreportingTable;

/***/ })

}]);
//# sourceMappingURL=0.plugin.js.map