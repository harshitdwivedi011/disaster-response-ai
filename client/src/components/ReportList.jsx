import React from "react";

const ReportList = ({ reports }) => {
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      {reports.map((r) => (
        <div key={r.id} className="border-b pb-3">
          <p>
            <strong>User:</strong> {r.user_id}
          </p>
          <p>
            <strong>Content:</strong> {r.content}
          </p>
          {r.image_url && (
            <img
              src={r.image_url}
              alt="report"
              className="w-full max-w-xs my-2 rounded"
            />
          )}
          <p className="text-sm text-gray-500">
            <strong>Status:</strong>{" "}
            <span
              className={
                r.verification_status === "Verified"
                  ? "text-green-500"
                  : "text-gray-500"
              }
            >
              {r.verification_status}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReportList;
