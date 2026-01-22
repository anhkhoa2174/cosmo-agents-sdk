/**
 * Apollo.io API Client for COSMO SDK
 * Direct integration with Apollo.io API for contact search and enrichment
 */

import axios, { AxiosInstance } from 'axios';

export interface ApolloConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PeopleSearchQuery {
  person_titles?: string[];
  include_similar_titles?: boolean;
  q_keywords?: string;
  person_locations?: string[];
  person_seniorities?: string[];
  organization_locations?: string[];
  organization_industry_tag_ids?: string[];
  q_organization_domains_list?: string[];
  contact_email_status?: string[];
  organization_ids?: string[];
  organization_num_employees_ranges?: string[];
  revenue_range_min?: number;
  revenue_range_max?: number;
  currently_using_all_of_technology_uids?: string[];
  currently_using_any_of_technology_uids?: string[];
  currently_not_using_any_of_technology_uids?: string[];
  q_organization_job_titles?: string[];
  organization_job_locations?: string[];
  organization_num_jobs_range_min?: number;
  organization_num_jobs_range_max?: number;
  organization_job_posted_at_range_min?: string;
  organization_job_posted_at_range_max?: string;
  page?: number;
  per_page?: number;
}

export interface OrganizationSearchQuery {
  q_organization_name?: string;
  q_organization_domains_list?: string[];
  organization_num_employees_ranges?: string[];
  organization_locations?: string[];
  organization_not_locations?: string[];
  currently_using_any_of_technology_uids?: string[];
  q_organization_keyword_tags?: string[];
  organization_ids?: string[];
  q_organization_job_titles?: string[];
  organization_job_locations?: string[];
  revenue_range_min?: number;
  revenue_range_max?: number;
  latest_funding_amount_range_min?: number;
  latest_funding_amount_range_max?: number;
  total_funding_range_min?: number;
  total_funding_range_max?: number;
  latest_funding_date_range_min?: string;
  latest_funding_date_range_max?: string;
  organization_num_jobs_range_min?: number;
  organization_num_jobs_range_max?: number;
  organization_job_posted_at_range_min?: string;
  organization_job_posted_at_range_max?: string;
  page?: number;
  per_page?: number;
}

export interface PeopleEnrichmentQuery {
  email?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  domain?: string;
  linkedin_url?: string;
}

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  title: string;
  headline: string;
  linkedin_url: string;
  photo_url: string;
  city: string;
  state: string;
  country: string;
  organization?: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string;
    industry: string;
    estimated_num_employees: number;
  };
}

export class ApolloApiClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly axiosInstance: AxiosInstance;

  constructor(config: ApolloConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.apollo.io/api/v1';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': this.apiKey,
      },
      timeout: 5 * 60 * 1000, // 5 minutes
    });
  }

  /**
   * Search for people using Apollo.io API
   */
  async peopleSearch(query: PeopleSearchQuery): Promise<{ people: ApolloContact[]; pagination: any }> {
    // Transform flat query params to Apollo API's bracket notation format
    const apiQuery: Record<string, any> = {};

    if (query.person_titles) apiQuery['person_titles[]'] = query.person_titles;
    if (query.include_similar_titles !== undefined) apiQuery.include_similar_titles = query.include_similar_titles;
    if (query.q_keywords) apiQuery.q_keywords = query.q_keywords;
    if (query.person_locations) apiQuery['person_locations[]'] = query.person_locations;
    if (query.person_seniorities) apiQuery['person_seniorities[]'] = query.person_seniorities;
    if (query.organization_locations) apiQuery['organization_locations[]'] = query.organization_locations;
    if (query.organization_industry_tag_ids) apiQuery['organization_industry_tag_ids[]'] = query.organization_industry_tag_ids;
    if (query.q_organization_domains_list) apiQuery['q_organization_domains_list[]'] = query.q_organization_domains_list;
    if (query.contact_email_status) apiQuery['contact_email_status[]'] = query.contact_email_status;
    if (query.organization_ids) apiQuery['organization_ids[]'] = query.organization_ids;
    if (query.organization_num_employees_ranges) apiQuery['organization_num_employees_ranges[]'] = query.organization_num_employees_ranges;
    if (query.revenue_range_min !== undefined) apiQuery['revenue_range[min]'] = query.revenue_range_min;
    if (query.revenue_range_max !== undefined) apiQuery['revenue_range[max]'] = query.revenue_range_max;
    if (query.currently_using_all_of_technology_uids) apiQuery['currently_using_all_of_technology_uids[]'] = query.currently_using_all_of_technology_uids;
    if (query.currently_using_any_of_technology_uids) apiQuery['currently_using_any_of_technology_uids[]'] = query.currently_using_any_of_technology_uids;
    if (query.currently_not_using_any_of_technology_uids) apiQuery['currently_not_using_any_of_technology_uids[]'] = query.currently_not_using_any_of_technology_uids;
    if (query.q_organization_job_titles) apiQuery['q_organization_job_titles[]'] = query.q_organization_job_titles;
    if (query.organization_job_locations) apiQuery['organization_job_locations[]'] = query.organization_job_locations;
    if (query.organization_num_jobs_range_min !== undefined) apiQuery['organization_num_jobs_range[min]'] = query.organization_num_jobs_range_min;
    if (query.organization_num_jobs_range_max !== undefined) apiQuery['organization_num_jobs_range[max]'] = query.organization_num_jobs_range_max;
    if (query.organization_job_posted_at_range_min) apiQuery['organization_job_posted_at_range[min]'] = query.organization_job_posted_at_range_min;
    if (query.organization_job_posted_at_range_max) apiQuery['organization_job_posted_at_range[max]'] = query.organization_job_posted_at_range_max;
    if (query.page !== undefined) apiQuery.page = query.page;
    if (query.per_page !== undefined) apiQuery.per_page = query.per_page;

    const response = await this.axiosInstance.post('/mixed_people/api_search', null, { params: apiQuery });
    return this.mapPeopleSearchResponse(response.data);
  }

  /**
   * Search for organizations using Apollo.io API
   */
  async organizationSearch(query: OrganizationSearchQuery): Promise<{ organizations: any[]; pagination: any }> {
    const apiQuery: Record<string, any> = {};

    if (query.q_organization_domains_list) apiQuery['q_organization_domains_list[]'] = query.q_organization_domains_list;
    if (query.organization_num_employees_ranges) apiQuery['organization_num_employees_ranges[]'] = query.organization_num_employees_ranges;
    if (query.organization_locations) apiQuery['organization_locations[]'] = query.organization_locations;
    if (query.organization_not_locations) apiQuery['organization_not_locations[]'] = query.organization_not_locations;
    if (query.currently_using_any_of_technology_uids) apiQuery['currently_using_any_of_technology_uids[]'] = query.currently_using_any_of_technology_uids;
    if (query.q_organization_keyword_tags) apiQuery['q_organization_keyword_tags[]'] = query.q_organization_keyword_tags;
    if (query.organization_ids) apiQuery['organization_ids[]'] = query.organization_ids;
    if (query.q_organization_job_titles) apiQuery['q_organization_job_titles[]'] = query.q_organization_job_titles;
    if (query.organization_job_locations) apiQuery['organization_job_locations[]'] = query.organization_job_locations;
    if (query.q_organization_name) apiQuery.q_organization_name = query.q_organization_name;
    if (query.revenue_range_min !== undefined) apiQuery['revenue_range[min]'] = query.revenue_range_min;
    if (query.revenue_range_max !== undefined) apiQuery['revenue_range[max]'] = query.revenue_range_max;
    if (query.latest_funding_amount_range_min !== undefined) apiQuery['latest_funding_amount_range[min]'] = query.latest_funding_amount_range_min;
    if (query.latest_funding_amount_range_max !== undefined) apiQuery['latest_funding_amount_range[max]'] = query.latest_funding_amount_range_max;
    if (query.total_funding_range_min !== undefined) apiQuery['total_funding_range[min]'] = query.total_funding_range_min;
    if (query.total_funding_range_max !== undefined) apiQuery['total_funding_range[max]'] = query.total_funding_range_max;
    if (query.latest_funding_date_range_min) apiQuery['latest_funding_date_range[min]'] = query.latest_funding_date_range_min;
    if (query.latest_funding_date_range_max) apiQuery['latest_funding_date_range[max]'] = query.latest_funding_date_range_max;
    if (query.organization_num_jobs_range_min !== undefined) apiQuery['organization_num_jobs_range[min]'] = query.organization_num_jobs_range_min;
    if (query.organization_num_jobs_range_max !== undefined) apiQuery['organization_num_jobs_range[max]'] = query.organization_num_jobs_range_max;
    if (query.organization_job_posted_at_range_min) apiQuery['organization_job_posted_at_range[min]'] = query.organization_job_posted_at_range_min;
    if (query.organization_job_posted_at_range_max) apiQuery['organization_job_posted_at_range[max]'] = query.organization_job_posted_at_range_max;
    if (query.page !== undefined) apiQuery.page = query.page;
    if (query.per_page !== undefined) apiQuery.per_page = query.per_page;

    const response = await this.axiosInstance.post('/mixed_companies/search', null, { params: apiQuery });
    return this.mapOrganizationSearchResponse(response.data);
  }

  /**
   * Enrich person data
   */
  async peopleEnrichment(query: PeopleEnrichmentQuery): Promise<any> {
    const response = await this.axiosInstance.post('/people/match', null, { params: query });
    return response.data;
  }

  /**
   * Enrich organization data
   */
  async organizationEnrichment(domain: string): Promise<any> {
    const response = await this.axiosInstance.post('/organizations/enrich', null, { params: { domain } });
    return response.data;
  }

  /**
   * Get person email using Apollo ID
   */
  async getPersonEmail(apolloId: string): Promise<string[]> {
    const payload = {
      entity_ids: [apolloId],
      analytics_context: 'Searcher: Individual Add Button',
      skip_fetching_people: true,
      cta_name: 'Access email',
      cacheKey: Date.now(),
    };

    const appAxios = axios.create({
      baseURL: 'https://app.apollo.io/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });

    const response = await appAxios.post('/mixed_people/add_to_my_prospects', payload);
    const emails = ((response.data && response.data.contacts) || []).map((contact: any) => contact.email);
    return emails;
  }

  /**
   * Find employees of a company
   */
  async employeesOfCompany(params: {
    company: string;
    website_url?: string;
    linkedin_url?: string;
    person_seniorities?: string;
    contact_email_status?: string;
  }): Promise<{ people: ApolloContact[]; pagination: any }> {
    // First search for the company
    const companySearchPayload = {
      q_organization_name: params.company,
      page: 1,
      per_page: 100,
    };

    const companiesResponse = await this.organizationSearch(companySearchPayload);
    if (!companiesResponse.organizations || companiesResponse.organizations.length === 0) {
      throw new Error('No organizations found');
    }

    // Filter by website or LinkedIn URL if provided
    let companyId = companiesResponse.organizations[0].id;
    if (params.website_url || params.linkedin_url) {
      const filtered = companiesResponse.organizations.filter((org: any) => {
        if (params.linkedin_url && org.linkedin_url && this.stripUrl(org.linkedin_url) === this.stripUrl(params.linkedin_url)) {
          return true;
        }
        if (params.website_url && org.website_url && this.stripUrl(org.website_url) === this.stripUrl(params.website_url)) {
          return true;
        }
        return false;
      });
      if (filtered.length > 0) {
        companyId = filtered[0].id;
      }
    }

    // Search for employees
    const peopleQuery: PeopleSearchQuery = {
      organization_ids: [companyId],
      page: 1,
      per_page: 100,
    };

    if (params.person_seniorities) {
      peopleQuery.person_seniorities = params.person_seniorities.split(',').map(s => s.trim());
    }
    if (params.contact_email_status) {
      peopleQuery.contact_email_status = params.contact_email_status.split(',').map(s => s.trim());
    }

    return this.peopleSearch(peopleQuery);
  }

  private stripUrl(url: string | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
  }

  private mapPeopleSearchResponse(response: any): { people: ApolloContact[]; pagination: any } {
    const people = (response.people || []).map((person: any) => ({
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
      name: person.name,
      email: person.email,
      title: person.title,
      headline: person.headline,
      linkedin_url: person.linkedin_url,
      photo_url: person.photo_url,
      city: person.city,
      state: person.state,
      country: person.country,
      organization: person.organization ? {
        id: person.organization.id,
        name: person.organization.name,
        website_url: person.organization.website_url,
        linkedin_url: person.organization.linkedin_url,
        industry: person.organization.industry,
        estimated_num_employees: person.organization.estimated_num_employees,
      } : undefined,
    }));

    return {
      people,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 10,
        total_entries: response.pagination?.total_entries || people.length,
        total_pages: response.pagination?.total_pages || 1,
      },
    };
  }

  private mapOrganizationSearchResponse(response: any): { organizations: any[]; pagination: any } {
    const organizations = (response.organizations || []).map((org: any) => ({
      id: org.id,
      name: org.name,
      website_url: org.website_url,
      linkedin_url: org.linkedin_url,
      industry: org.industry,
      estimated_num_employees: org.estimated_num_employees,
      phone: org.phone,
      city: org.city,
      state: org.state,
      country: org.country,
      short_description: org.short_description,
      founded_year: org.founded_year,
    }));

    return {
      organizations,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 10,
        total_entries: response.pagination?.total_entries || organizations.length,
        total_pages: response.pagination?.total_pages || 1,
      },
    };
  }
}
