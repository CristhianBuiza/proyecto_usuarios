import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Result } from "../types/users";

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

const useFetchUsers = (currentPage: number, selectedNationality: string) => {
  const [filteredUsers, setFilteredUsers] = useState<Result[]>([]);
  const {
    isLoading,
    isError,
    data: users = [],
  } = useQuery<Result[], Error>({
    queryKey: ["users", currentPage, selectedNationality],
    queryFn: () => fetchUser(currentPage, selectedNationality),
  });

  useEffect(() => {
    if (users.length > 0) {
      setFilteredUsers(users);
    }
  }, [users]);

  return { isLoading, isError, filteredUsers };
};

export default useFetchUsers;
