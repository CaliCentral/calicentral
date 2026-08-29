import {ContentEmptyState} from "@/components/ui/content-empty-state";
import {Container} from "@/components/ui/container";

export default function TeamNotFound() {
  return <Container className="py-24"><ContentEmptyState title="Team record not found" description="This public team record is unavailable, unpublished, or excluded by its current status." eyebrow="Team directory / Not found" /></Container>;
}

