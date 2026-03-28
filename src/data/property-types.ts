export interface PropertyTypeData {
  name: string;
  slug: string;
  description: string;
  keyChecklist: string[];
}

export const propertyTypes: PropertyTypeData[] = [
  {
    name: "Retail",
    slug: "retail",
    description: "Retail LOIs require careful attention to co-tenancy clauses, exclusive use provisions, and percentage rent structures. Operating hour requirements, signage rights, and parking ratios directly impact a retail tenant's ability to generate revenue. Common area maintenance allocations in shopping centers can create significant cost variability if not properly capped.",
    keyChecklist: [
      "Exclusive use clause protecting tenant's product category",
      "Co-tenancy requirements tied to anchor tenant occupancy",
      "Percentage rent breakpoint and calculation methodology",
      "Signage rights including monument, pylon, and storefront",
      "Parking ratio and customer parking allocation",
      "Operating hours covenant with force majeure exceptions",
      "Radius restriction limiting competing locations",
    ],
  },
  {
    name: "Office",
    slug: "office",
    description: "Office LOIs center on measurement standards (BOMA vs usable square footage), after-hours HVAC charges, and building amenity access. The distinction between full-service gross and modified gross lease structures significantly affects total occupancy costs. Technology infrastructure, including fiber connectivity and generator access, is increasingly critical.",
    keyChecklist: [
      "Square footage measurement standard (BOMA 2017 vs usable)",
      "After-hours HVAC rate and minimum block time",
      "Base year or expense stop for operating expenses",
      "Telecom riser and data infrastructure access",
      "Building amenity access (conference rooms, fitness center)",
      "Landlord consent standard for alterations",
      "Expansion and contraction rights with pricing terms",
    ],
  },
  {
    name: "Industrial",
    slug: "industrial",
    description: "Industrial LOIs must specify clear heights, dock door configurations, truck court depth, and floor load capacity. Environmental baseline assessments are critical to avoid inherited contamination liability. Power capacity, fire suppression systems, and outside storage rights frequently become negotiation points.",
    keyChecklist: [
      "Clear height specification and column spacing",
      "Dock doors (number, type: grade-level vs recessed)",
      "Truck court depth and trailer parking allowance",
      "Floor load capacity and slab thickness",
      "Power capacity (amps, voltage, three-phase availability)",
      "Environmental baseline assessment responsibility",
      "Outside storage rights and fencing provisions",
    ],
  },
  {
    name: "Mixed-Use",
    slug: "mixed-use",
    description: "Mixed-use LOIs involve complex allocation of shared systems and common areas across residential, retail, and office components. Operating expense pro-rata shares must account for different usage patterns by tenant type. Noise ordinances, delivery hour restrictions, and shared parking arrangements require detailed provisions.",
    keyChecklist: [
      "Pro-rata share calculation methodology across uses",
      "Noise and vibration restrictions between uses",
      "Delivery hours and loading dock scheduling",
      "Shared parking allocation and time-of-day restrictions",
      "Separate utility metering by tenant type",
      "Common area cost allocation between residential and commercial",
      "Signage hierarchy across different tenant categories",
    ],
  },
  {
    name: "Multifamily",
    slug: "multifamily",
    description: "Multifamily LOIs for commercial tenants within residential buildings involve unique considerations around operating hours, noise restrictions, and resident impact. Ground-floor retail in multifamily projects faces specific challenges with exhaust ventilation, delivery access, and signage limitations. Lease structures must account for condominium association rules when applicable.",
    keyChecklist: [
      "Operating hours compatible with residential occupancy",
      "Exhaust and ventilation specifications for food service",
      "Separate commercial entrance and delivery access",
      "Noise level restrictions and measurement standards",
      "Signage limitations imposed by residential aesthetics",
      "Trash and recycling separation from residential systems",
    ],
  },
  {
    name: "Medical",
    slug: "medical",
    description: "Medical LOIs involve heightened regulatory compliance including ADA accessibility, medical waste disposal, and specialized HVAC requirements for air exchange rates. After-hours access is essential for urgent care and healthcare facilities. Hazardous materials provisions must address biomedical waste, pharmaceuticals, and imaging equipment shielding.",
    keyChecklist: [
      "ADA compliance beyond standard commercial requirements",
      "HVAC air exchange rates for exam and procedure rooms",
      "Medical waste disposal access and storage provisions",
      "24/7 building access for emergency patient care",
      "Lead shielding for radiology and imaging equipment",
      "Patient privacy and HIPAA-compliant build-out",
      "Specialized plumbing for medical gas and vacuum systems",
    ],
  },
  {
    name: "Restaurant",
    slug: "restaurant",
    description: "Restaurant LOIs require detailed specifications for grease trap capacity, kitchen exhaust hood systems, and make-up air units. Utility capacity for commercial cooking equipment frequently exceeds standard building provisions. Outdoor seating rights, liquor license transferability, and extended operating hours are critical lease negotiation points.",
    keyChecklist: [
      "Grease trap sizing and maintenance responsibility",
      "Kitchen exhaust hood and make-up air specifications",
      "Gas and electrical capacity for commercial cooking equipment",
      "Outdoor seating or patio rights and seasonal terms",
      "Liquor license provisions and transferability",
      "Extended operating hours including late-night service",
      "Odor and noise mitigation requirements",
    ],
  },
  {
    name: "Warehouse",
    slug: "warehouse",
    description: "Warehouse LOIs must address clear heights, sprinkler system capacity, and loading infrastructure for distribution operations. Trailer parking and staging areas are often as critical as interior square footage. Power capacity for automated systems and cold storage specifications require detailed technical provisions.",
    keyChecklist: [
      "Clear height and eave height specifications",
      "Sprinkler system type (ESFR, in-rack) and capacity",
      "Number and type of loading docks and drive-in doors",
      "Trailer drop lot and staging area allocation",
      "Power capacity for automation and conveyor systems",
      "Cold storage or refrigeration infrastructure",
      "Rail siding or rail spur access provisions",
    ],
  },
];
