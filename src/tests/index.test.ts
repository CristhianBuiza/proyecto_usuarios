import { render, fireEvent, waitFor } from "@testing-library/react";
import App, { fetchUser } from "./App";
import { act } from "react-dom/test-utils";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn().mockImplementation(() => ({
    isLoading: false,
    isError: false,
    data: [],
  })),
}));

describe("App Component Tests", () => {
  test("test_fetchUser_returns_correct_data", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ name: "John Doe" }] }),
      })
    ) as jest.Mock;

    const users = await fetchUser(1, "US");
    expect(users).toEqual([{ name: "John Doe" }]);
    expect(fetch).toHaveBeenCalledWith(
      "https://randomuser.me/api/?seed=prueba&page=1&results=10&nat=US"
    );
  });

  test("test_handleEditChange_updates_state_correctly", async () => {
    const { getByText, getByRole } = render(<App />);
    const editButton = getByText(/Editar/);
    fireEvent.click(editButton);

    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane Doe" } });

    await waitFor(() => {
      expect(input).toHaveValue("Jane Doe");
    });
  });

  test("test_saveChanges_updates_and_resets_states_correctly", async () => {
    const { getByText, queryByText } = render(<App> <App/>);
    const editButton = getByText(/Editar/);
    fireEvent.click(editButton);

    const saveButton = getByText(/Guardar/);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(queryByText(/Guardar/)).toBeNull();
      expect(queryByText(/Editar/)).not.toBeNull();
    });
  });
});
