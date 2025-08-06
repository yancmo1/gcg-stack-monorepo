
import React from 'react';

function RecordTable({ records, onEdit, onDelete }) {
  return (
    <table className="record-table">
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Title</th>
          <th>Region</th>
          <th>Start Date</th>
          <th>Completion Date</th>
          <th>Status</th>
          <th>Sort Order</th>
          <th>Notes</th>
          <th>Trainer</th>
          <th>MTL Completed</th>
          <th>New Hire Test Score</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {records.map((rec) => (
          <tr key={rec.id}>
            <td>{rec.employee_name}</td>
            <td>{rec.title}</td>
            <td>{rec.region}</td>
            <td>{rec.start_date}</td>
            <td>{rec.completion_date}</td>
            <td>{rec.status}</td>
            <td>{rec.sort_order}</td>
            <td>{rec.notes}</td>
            <td>{rec.trainer}</td>
            <td>{rec.mtl_completed}</td>
            <td>{rec.new_hire_test_score}</td>
            <td>
              <button
                style={{ marginRight: '0.5rem', background: '#fbbf24', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                onClick={() => onEdit(rec)}
              >Edit</button>
              <button
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                onClick={() => onDelete(rec)}
              >Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default RecordTable;
