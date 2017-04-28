/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/href-no-hash */
const App = React.createClass({

  getInitialState() {
    return {
      mode: 'currentView',
      dataset: config.datasets[0],
      fields: [],
      showAbout: false,
    };
  },

  componentDidMount() {
    const self = this;
    this.readFields();
  },

  readFields(callback) {
    const { dataset } = this.state;

    $.getJSON(dataset.fields, (fields) => {
      fields.forEach((field) => field.checked = false);
      this.setState({ fields });
    });
  },

  // returns
  getFields() {
    const { fields } = this.state;

    const checkedFields = fields.filter(field => field.checked === true); // filter for checked
    const fieldsValues = checkedFields.map(field => field.value); // map to just the values
    fieldsValues.unshift('the_geom'); // add 'the_geom' to the beginning of the array
    return fieldsValues.join(',');
  },

  setCurrentViewIntersect() {
    const { bounds } = this.state;
    const intersect = `
      ST_MakeEnvelope(
        ${bounds._southWest.lng},
        ${bounds._southWest.lat},
        ${bounds._northEast.lng},
        ${bounds._northEast.lat},
      4326)
    `;
    this.setState({ intersect });
  },

  handleModeChange(e) {
    const mode = e.target.value;
    this.setState({
      mode,
      intersect: null,
    });
    if (mode === 'currentView') this.setCurrentViewIntersect();
  },

  handleDatasetChange(e) {
    const datasetId = e.target.value;
    const that = this;
    this.setState({
        dataset: $.grep(config.datasets, d => d.id == datasetId)[0],
        intersect: null
    }, this.readFields);
  },

  handleDownload(type) {
    const { intersect, dataset } = this.state;
    const fields = this.getFields();
    const apiCall = `//${config.username}.carto.com/api/v2/sql?skipfields=cartodb_id,created_at,updated_at&format=${type}&filename=${dataset.table}&q=SELECT ${fields} FROM ${dataset.table} a WHERE ST_INTERSECTS(${intersect}, a.the_geom)`;

    console.log(`Calling SQL API: ${apiCall}`); // eslint-disable-line
    window.open(apiCall, 'Download');
  },

  handleBoundsChange(bounds) {
    this.setState({ bounds }, () => {
      if (this.state.mode === 'currentView') this.setCurrentViewIntersect();
    });
  },

  handleFieldChange(e) {
    const { value } = e.target;
    const { fields } = this.state;

    const thisField = fields.filter(field => field.value === value)[0];

    thisField.checked = !thisField.checked;

    this.setState({ fields });
  },

  handleSelectAll() {
    const { fields } = this.state;
    fields.forEach((field) => {
      field.checked = true;
    });
    this.setState({ fields });
  },

  handleSelectNone() {
    const { fields } = this.state;
    fields.forEach((field) => {
      field.checked = false;
    });
    this.setState({ fields });
  },

  handleUpdateIntersect(intersect) {
    this.setState({ intersect });
  },

  render() {
    const { mode, fields, showAbout, dataset } = this.state;

    return (
      <div>
        <Map
          mode={mode}
          onBoundsChange={this.handleBoundsChange}
          onUpdateIntersect={this.handleUpdateIntersect}
          dataset={dataset}
        />
        <Sidebar
          fields={fields}
          mode={mode}
          dataset={dataset}
          intersect={this.state.intersect}
          onModeChange={this.handleModeChange}
          onDatasetChange={this.handleDatasetChange}
          onDownload={this.handleDownload}
          onFieldChange={this.handleFieldChange}
          onSelectAll={this.handleSelectAll}
          onSelectNone={this.handleSelectNone}
        />
      </div>
    );
  },
});


ReactDOM.render(<App />, document.getElementById('main'));
