import { GameCard } from "@/components/cards/GameCard";
import { Game } from "@/components/providers/game/useGame";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export function GamesListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const fetchGames = useCallback(async () => {
    const response = await axiosInstance.get(
      `/api/game?page=${page}&limit=${limit}`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch games");
    }
  }, [limit, page]);

  const query = useQuery<{
    games: Game[];
    totalItems: number;
    totalPages: number;
    page: number;
    userMap: Record<string, string>;
  }>({
    queryKey: ["games", page, limit],
    queryFn: fetchGames,
  });

  return (
    <div>
      {query.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      )}
      {query.isError && <p>Error: {query.error.message}</p>}
      {query.isSuccess && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {query.data.games.map((game) => (
            <GameCard
              key={game.gameId}
              game={game}
              userMap={query.data.userMap || {}}
            />
          ))}
        </div>
      )}

      {query.data?.page || 0 > 0 || query.data?.totalPages || 1 > 1 ? (
        <Pagination className="mt-4">
          <PaginationContent>
            <p className="text-sm text-black/50 font-semibold">
              {query.data?.page || 1} / {query.data?.totalPages || 1}
            </p>
            {(query.data?.page || 1) > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </PaginationPrevious>
              </PaginationItem>
            )}
            {(query.data?.page || 1) < (query.data?.totalPages || 1) && (
              <PaginationItem>
                <PaginationNext onClick={() => setPage((prev) => prev + 1)}>
                  Next
                </PaginationNext>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
