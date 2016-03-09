import React from 'react';
import { Input, Button } from 'react-bootstrap';
import BootstrapModalForm from 'components/bootstrap/BootstrapModalForm';
import { IfPermitted, ISODurationInput } from 'components/common';
import ObjectUtils from 'util/ObjectUtils';

import moment from 'moment';
import {} from 'moment-duration-format';

import TimeRangeOptionsForm from './TimeRangeOptionsForm';
import TimeRangeOptionsSummary from './TimeRangeOptionsSummary';
import style from '!style!css!components/configurations/ConfigurationStyles.css';

const SearchesConfig = React.createClass({
  propTypes: {
    config: React.PropTypes.object.isRequired,
    updateConfig: React.PropTypes.func.isRequired,
  },

  getInitialState() {
    const queryTimeRangeLimit = this._getPropConfigValue('query_time_range_limit');
    const relativeTimerangeOptions = this._getPropConfigValue('relative_timerange_options');
    return {
      config: {
        query_time_range_limit: queryTimeRangeLimit,
        relative_timerange_options: relativeTimerangeOptions,
      },
      limitEnabled: moment.duration(queryTimeRangeLimit).asMilliseconds() > 0,
    };
  },

  _getPropConfigValue(field) {
    return this.props.config ? this.props.config[field] : undefined;
  },

  _onUpdate(field) {
    return (newOptions) => {
      const update = ObjectUtils.clone(this.state.config);

      update[field] = newOptions;

      this.setState({config: update});
    };
  },

  _onChecked() {
    const config = ObjectUtils.clone(this.state.config);

    if (this.state.limitEnabled) {
      // If currently enabled, disable by setting the limit to 0 seconds.
      config.query_time_range_limit = 'PT0S';
    } else {
      // If currently not enabled, set a default of 30 days.
      config.query_time_range_limit = 'P30D';
    }

    this.setState({config: config, limitEnabled: !this.state.limitEnabled});
  },

  _isEnabled() {
    return this.state.limitEnabled;
  },

  _saveConfig() {
    this.props.updateConfig(this.state.config).then(() => {
      this._closeModal();
    });
  },

  _resetConfig() {
    // Reset to initial state when the modal is closed without saving.
    this.setState(this.getInitialState());
  },

  _openModal() {
    this.refs.searchesConfigModal.open();
  },

  _closeModal() {
    this.refs.searchesConfigModal.close();
  },

  render() {
    const config = this.state.config;
    const duration = moment.duration(config.query_time_range_limit);
    const limit = this._isEnabled() ? `${config.query_time_range_limit} (${duration.format()})` : 'disabled';

    return (
      <div>
        <h2>Search Configuration</h2>

        <dl className={style.deflist}>
          <dt>Query time range limit</dt>
          <dd>{limit}</dd>
          <dd>The maximum time users can query data in the past. This prevents users from accidentally creating queries which
            span a lot of data and would need a long time and many resources to complete (if at all).</dd>
        </dl>

        <strong>Relative time range options</strong>

        <TimeRangeOptionsSummary options={this.state.config.relative_timerange_options} />

        <IfPermitted permissions="clusterconfigentry:edit">
          <Button bsStyle="info" bsSize="xs" onClick={this._openModal}>Update</Button>
        </IfPermitted>

        <BootstrapModalForm ref="searchesConfigModal"
                            title="Update Search Configuration"
                            onSubmitForm={this._saveConfig}
                            onModalClose={this._resetConfig}
                            submitButtonText="Save">
          <fieldset>
            <Input type="checkbox" label="Enable query limit"
                   name="enabled"
                   checked={this._isEnabled()}
                   onChange={this._onChecked}/>
            {this._isEnabled() &&
            <ISODurationInput duration={config.query_time_range_limit}
                              update={this._onUpdate('query_time_range_limit')}
                              label="Query time range limit (ISO8601 Duration)"
                              help={'The maximum time range for searches. (i.e. "P30D" for 30 days, "PT24H" for 24 hours)'}
                              validator={(milliseconds) => milliseconds >= 1}
                              required />
            }

            <TimeRangeOptionsForm options={this.state.config.relative_timerange_options}
                                  update={this._onUpdate('relative_timerange_options')}
                                  validator={(milliseconds, dur) => milliseconds >= 1 || dur === 'PT0S'}
                                  title="Relative Timerange Options"
                                  help={<span>Configure the available options for the <strong>relative</strong> time range selector as <strong>ISO8601 duration</strong></span>} />
          </fieldset>
        </BootstrapModalForm>
      </div>
    );
  },
});

export default SearchesConfig;
