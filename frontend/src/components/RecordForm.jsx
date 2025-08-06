import React, { useState } from 'react';

const initialState = {
  employee_name: '',
  title: '',
  region: '',
  start_date: '',
  completion_date: '',
  status: '',
  sort_order: '',
  notes: '',
  trainer: '',
  mtl_completed: '',
  new_hire_test_score: '',
};

function RecordForm({ onAdd }) {
  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm(initialState);
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      {Object.keys(initialState).map((key) => (
        <div key={key}>
          <label>{key.replace(/_/g, ' ')}:</label>
          <input
            name={key}
            value={form[key]}
            onChange={handleChange}
            required={key !== 'notes' && key !== 'completion_date' && key !== 'mtl_completed' && key !== 'new_hire_test_score'}
          />
        </div>
      ))}
      <button type="submit">Add Record</button>
    </form>
  );
}

export default RecordForm;
