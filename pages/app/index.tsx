import AppLayout from "components/layout/app";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { ProjectProps } from "@/lib/types";
import ProjectCard from "@/components/app/project-card";

export default function App() {
  const { data } = useSWR<ProjectProps[]>(`/api/projects`, fetcher);

  return (
    <AppLayout>
      <MaxWidthWrapper>
        <div className="my-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {data ? data.map((d) => <ProjectCard {...d} />) : null}
        </div>
      </MaxWidthWrapper>
    </AppLayout>
  );
}