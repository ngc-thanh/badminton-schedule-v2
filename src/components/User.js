import React from "react";

const User = ({ users, onClickRow }) => {
  const handleRowClick = (data) => {
    onClickRow(data);
  };

  const filteredUser = users.filter(u => u.data.active === true); 

  return (
    <div className="overflow-x-auto">
      <h1 className="text-left mb-2 font-bold">USERS ({filteredUser.length})</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              TÊN
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              ĐIỂM
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              OK
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              HUỶ
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              TRỄ
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              IP
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              UPDATED
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              STATUS
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users &&
            users.map((user) => {
              const updatedDatetime = new Date(user.data.updated.toDate());
              const createdDatetime = new Date(user.data.created.toDate());
              const options = {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false, // Use 24-hour format
              };
              const updatedAt = updatedDatetime.toLocaleString(
                undefined,
                options
              );
              const createdAt = createdDatetime.toLocaleString(
                undefined,
                options
              );

              return user.data.active && (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 font-medium text-gray-900">
                      {user.data.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.point}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.ok}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.cancel}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.delay}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.ipAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-left">
                    <div className="text-sm leading-5 text-gray-900">
                      {updatedAt}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-no-wrap text-left"
                    onClick={() => handleRowClick(user)}
                  >
                    <div className="text-sm leading-5 text-gray-900">
                      {user.data.active ? "" : "X"}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default User;
