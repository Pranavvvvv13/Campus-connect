import { ExternalLink } from "lucide-react";
import { facultyResearch } from "@/lib/faculty-research";
import linkedinSnapshot from "@/lib/faculty-linkedin.json";
import "./faculty-research.css";

export function FacultyResearchInfo({ email }: { email: string }) {
  const record = facultyResearch.get(email);
  if (!record || record.status !== "verified") {
    const linkedin = linkedinSnapshot.faculty.find(person => person.email === email);
    const available = linkedin?.status === "officially-published" && linkedin.profileUrl;
    return <section className="faculty-research-info" aria-label="Faculty professional profile">
      <h3>Professional profile</h3>
      {available ? <>
        <a className="secondary-button full" href={linkedin.profileUrl!} target="_blank" rel="noreferrer">View LinkedIn profile <ExternalLink size={15}/></a>
        <p className="faculty-research-date">LinkedIn link published by SRM · Checked {linkedin.checkedOn}</p>
      </> : <p className="faculty-profile-unavailable">LinkedIn profile not available</p>}
      {linkedin?.identitySourceUrl && <p className="faculty-research-date"><a href={linkedin.identitySourceUrl} target="_blank" rel="noreferrer">Official faculty profile</a></p>}
    </section>;
  }
  return <section className="faculty-research-info" aria-label="Google Scholar research">
    <h3>Research interests</h3>
    {record.interests?.length ? <div className="faculty-research-topics">{record.interests.map(topic => <span key={topic}>{topic}</span>)}</div>
      : <p className="faculty-profile-unavailable">Research interests not listed on Scholar</p>}
    {record.metrics ? <>
      <dl className="faculty-research-metrics">
        <div><dt>Citations</dt><dd>{record.metrics.all.citations.toLocaleString("en-IN")}</dd></div>
        <div><dt>h-index</dt><dd>{record.metrics.all.hIndex}</dd></div>
        <div><dt>i10-index</dt><dd>{record.metrics.all.i10Index}</dd></div>
      </dl>
      <p className="faculty-research-date">All time · Since 2021: {record.metrics.since2021.citations.toLocaleString("en-IN")} citations, h-index {record.metrics.since2021.hIndex}, i10-index {record.metrics.since2021.i10Index}</p>
    </> : <p className="faculty-profile-unavailable">Citation metrics not listed on Scholar</p>}
    <a className="secondary-button full" href={record.profileUrl ?? undefined} target="_blank" rel="noreferrer">Publications on Google Scholar <ExternalLink size={15} /></a>
    <p className="faculty-research-date">Checked {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(record.checkedOn+"T00:00:00Z"))}{record.identitySourceUrl && <> · <a href={record.identitySourceUrl} target="_blank" rel="noreferrer">Identity source</a></>}</p>
  </section>;
}
