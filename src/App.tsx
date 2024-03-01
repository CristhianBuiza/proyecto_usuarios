import { useQuery } from "@tanstack/react-query";
import { Result } from "./types/users";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
interface EditableUsers {
  [index: number]: Partial<Result>; // Modifica Partial<Result> si no todos los campos son editables
}
type SortKey = "name.first" | "gender" | "location.country" | null;

const fetchUser = async (
  page: number,
  nationality: string
): Promise<Result[]> => {
  let url = `https://randomuser.me/api/?seed=prueba&page=${page}&results=10`;
  if (nationality) url += `&nat=${nationality}`;
  console.log(url);
  const response = await fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("La respuesta no es ok");
      return res.json();
    })
    .then((data) => {
      return data.results;
    });

  return response;
};

function App() {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<Result[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editableUsers, setEditableUsers] = useState<EditableUsers>({});
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const toggleEdit = () => {
    if (selectedIndices.length > 0 && !isEditing) {
      const editingUsers = selectedIndices.reduce((acc, currentIndex) => {
        const currentUser = filteredUsers[currentIndex];
        acc[currentIndex] = { ...currentUser };
        return acc;
      }, {});
      setEditableUsers(editingUsers);
      setIsEditing(true);
    } else {
      toast.error("No se ha seleccionado nada para editar.");
      setIsEditing(false); // Para salir del modo de edición
    }
  };

  const toggleFilters = () => setIsFiltersVisible(!isFiltersVisible);

  const handleNationalityChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedNationality(e.target.value);

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedGender(e.target.value);

  const handleUserSelection = (index: number, isSelected: boolean) => {
    setSelectedIndices(
      (prev) =>
        isSelected
          ? [...prev, index] // Añadir índice
          : prev.filter((i) => i !== index) // Remover índice
    );
  };
  const handleEditChange = (
    value: string | number,
    index: number,
    field: string
  ) => {
    setEditableUsers((prev: EditableUsers) => {
      const updatedUsers = { ...prev };
      // Manejo de campos anidados
      const fieldParts = field.split(".");
      const lastField = fieldParts.pop();
      let currentPart = updatedUsers[index];

      fieldParts.forEach((part) => {
        if (!currentPart[part]) currentPart[part] = {};
        currentPart = currentPart[part];
      });

      if (lastField) {
        currentPart[lastField] = value;
      }

      return updatedUsers;
    });
  };

  const saveChanges = () => {
    setFilteredUsers((currentUsers) => {
      const updatedUsers = [...currentUsers];
      Object.entries(editableUsers).forEach(([index, userData]) => {
        updatedUsers[index] = userData;
      });
      return updatedUsers;
    });
    setIsEditing(false); // Salir del modo de edición
    setEditableUsers({}); // Limpiar los usuarios editables
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) {
      toast.error("No se ha seleccionado nada para eliminar.");
      return;
    }
    setFilteredUsers((currentUsers) =>
      currentUsers.filter((_, index) => !selectedIndices.includes(index))
    );
    setSelectedIndices([]); // Limpia los índices seleccionados después de eliminar
  };
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };
  const sortedUsers = useMemo(() => {
    const sortableUsers = [...filteredUsers];
    if (sortConfig.key !== null) {
      sortableUsers.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);
  const requestSort = (key: SortKey) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
    setSelectedIndices([]); // Limpia los índices seleccionados
  };
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setSelectedIndices([]); // Limpia los índices seleccionados
  };

  const {
    isLoading,
    isError,
    data: users = [],
  } = useQuery<Result[], Error>({
    queryKey: ["users", currentPage, selectedNationality],
    queryFn: () => fetchUser(currentPage, selectedNationality),
  });
  console.log("users", users);
  useEffect(() => {
    if (selectedGender) {
      setFilteredUsers(users.filter((user) => user.gender === selectedGender));
    } else {
      setFilteredUsers(users);
    }
  }, [users, selectedGender]);
  useEffect(() => {
    if (isLoading) {
      toast.loading("Cargando usuarios...", { duration: 3000 }); // Duración más larga
    } else {
      toast.dismiss(); // Descartar el toast cuando isLoading sea false
      if (!isError && users.length > 0) {
        toast.success("Usuarios cargados", {
          icon: <FontAwesomeIcon icon={faCheck} />,
        });
      }
    }
  }, [isLoading, isError]);
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand mx-auto" href="#">
            <img
              src="https://logo.clearbit.com/clearbit.com"
              alt="Logo de la empresa"
              className="d-inline-block align-text-top"
              height="30"
              width="30"
              loading="lazy"
            />
          </a>
        </div>
      </nav>
      <div className="container  pt-5">
        <div className="row">
          <div className="col-sm-12 col-md-12">
            <div className="dt-title ">
              <h2>Usuarios de ramdom user</h2>
            </div>
          </div>
          <div className="col-sm-12 col-md-6 mt-3">
            <div className="d-flex justify-content-start align-items-center">
              <button
                className="btn btn-sm btn-outline-primary px-4 me-2"
                onClick={toggleFilters}
              >
                <i className="bi bi-sliders"></i> Filtros
              </button>
              <button
                className="btn btn-sm btn-outline-primary px-4 me-2"
                onClick={isEditing ? saveChanges : toggleEdit}
              >
                <i className="bi bi-pencil"></i>{" "}
                {isEditing ? "Guardar" : "Editar"}
              </button>
              <button
                className="btn btn-sm btn-outline-danger px-4 me-2"
                onClick={handleDeleteSelected}
              >
                <i className="bi bi-trash3"></i> Eliminar
              </button>
            </div>
          </div>
          <div
            className={`col-sm-12 mt-4 filtros-content ${
              isFiltersVisible ? "" : "d-none"
            }`}
          >
            <div className="card border-0 shadow-sm">
              <div className="card-body ">
                <div className="row py-3">
                  <div className="form-group  col-sm-12 col-lg-4 ">
                    <div className="input-group ">
                      <select
                        className="form-select form-select-sm single-select select-bs"
                        value={selectedNationality}
                        onChange={handleNationalityChange}
                      >
                        <optgroup label="NACIONALIDAD">
                          <option value="">Todas</option>
                          <option value="AU">AU</option>
                          <option value="BR">BR</option>
                          <option value="CA">CA</option>
                          <option value="CH">CH</option>

                          <option value="DE">DE</option>
                          <option value="DK">DK</option>
                          <option value="ES">ES</option>
                          <option value="FI">FI</option>
                          <option value="FR">FR</option>
                          <option value="GB">GB</option>
                          <option value="IE">IE</option>
                          <option value="IN">IN</option>
                          <option value="IR">IR</option>
                          <option value="MX">MX</option>
                          <option value="NL">NL</option>
                          <option value="NO">NO</option>
                          <option value="NZ">NZ</option>
                          <option value="RS">RS</option>
                          <option value="TR">TR</option>
                          <option value="UA">UA</option>
                          <option value="US">US</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div className="form-group  col-sm-12 col-lg-4 ">
                    <div className="input-group ">
                      <select
                        className="form-select form-select-sm single-select select-bs"
                        value={selectedGender}
                        onChange={handleGenderChange}
                      >
                        <optgroup label="GENERO">
                          <option value="">Todos</option>
                          <option value="female">FEMALE</option>
                          <option value="male">MALE</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-12 pt-1">
            <div className="dt-example">
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Foto</th>
                      <th
                        onClick={() => requestSort("name.first")}
                        style={{ backgroundColor: "#ddd" }}
                        className="cursor-pointer"
                      >
                        Nombre{" "}
                        {sortConfig.key === "name.first" && (
                          <FontAwesomeIcon
                            icon={
                              sortConfig.direction === "ascending"
                                ? faArrowUp
                                : faArrowDown
                            }
                          />
                        )}
                      </th>
                      <th
                        className="cursor-pointer"
                        style={{ backgroundColor: "#ddd" }}
                        onClick={() => requestSort("gender")}
                      >
                        Género{" "}
                        {sortConfig.key === "gender" && (
                          <FontAwesomeIcon
                            icon={
                              sortConfig.direction === "ascending"
                                ? faArrowUp
                                : faArrowDown
                            }
                          />
                        )}
                      </th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th>Correo electrónico</th>
                      <th
                        style={{ backgroundColor: "#ddd" }}
                        onClick={() => requestSort("location.country")}
                        className="cursor-pointer"
                      >
                        País{" "}
                        {sortConfig.key === "location.country" && (
                          <FontAwesomeIcon
                            icon={
                              sortConfig.direction === "ascending"
                                ? faArrowUp
                                : faArrowDown
                            }
                          />
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <Skeleton count={10} width={600} height={848} />
                    ) : (
                      <>
                        {sortedUsers?.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedIndices?.includes(index)}
                                onChange={(e) =>
                                  handleUserSelection(index, e.target.checked)
                                }
                              />
                            </td>
                            <td>
                              <img
                                loading="lazy"
                                width={50}
                                height={50}
                                src={item?.picture?.thumbnail}
                                alt="Foto de perfil"
                                className="img-thumbnail border-0 rounded-circle"
                              />
                            </td>
                            <td>
                              {isEditing &&
                              editableUsers?.hasOwnProperty(index) ? (
                                <input
                                  type="text"
                                  value={editableUsers[index]?.name?.first}
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "name.first"
                                    )
                                  }
                                />
                              ) : (
                                `${item?.name?.first} ${item?.name?.last}`
                              )}
                            </td>
                            <td>
                              {isEditing && editableUsers[index] != null ? (
                                <input
                                  type="text"
                                  value={editableUsers[index].gender}
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "gender"
                                    )
                                  }
                                />
                              ) : (
                                item.gender
                              )}
                            </td>
                            <td>
                              {isEditing && editableUsers[index] != null ? (
                                <input
                                  type="text"
                                  value={
                                    editableUsers[index]?.location.street.name
                                  }
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "location.street.name"
                                    )
                                  }
                                />
                              ) : (
                                item.location.street.name
                              )}
                            </td>
                            <td>
                              {isEditing && editableUsers[index] != null ? (
                                <input
                                  type="text"
                                  value={editableUsers[index].phone}
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "phone"
                                    )
                                  }
                                />
                              ) : (
                                item.phone
                              )}
                            </td>
                            <td>
                              {isEditing && editableUsers[index] != null ? (
                                <input
                                  type="text"
                                  value={editableUsers[index].email}
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "email"
                                    )
                                  }
                                />
                              ) : (
                                item.email
                              )}
                            </td>
                            <td>
                              {isEditing && editableUsers[index] != null ? (
                                <input
                                  type="text"
                                  value={editableUsers[index].location.country}
                                  onChange={(e) =>
                                    handleEditChange(
                                      e.target.value,
                                      index,
                                      "location.country"
                                    )
                                  }
                                />
                              ) : (
                                item.location.country
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <nav>
                <ul className="pagination justify-content-between">
                  <li
                    className="page-item cursor-pointer"
                    onClick={handlePreviousPage}
                  >
                    <div className="page-link">Anterior</div>
                  </li>
                  <li
                    className="page-item cursor-pointer"
                    onClick={handleNextPage}
                  >
                    <div className="page-link">Siguiente</div>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
