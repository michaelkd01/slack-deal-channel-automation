class NamingService {
  static generateChannelName(template, variables) {
    let channelName = template;
    
    const replacements = {
      '{client}': variables.clientName || 'unknown',
      '{client_short}': (variables.clientName || 'unknown').substring(0, 10),
      '{deal}': variables.dealName || 'deal',
      '{deal_id}': variables.dealId || '',
      '{date}': new Date().toISOString().split('T')[0],
      '{year}': new Date().getFullYear().toString(),
      '{month}': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      '{day}': new Date().getDate().toString().padStart(2, '0'),
      '{owner}': variables.dealOwner || '',
      '{owner_initials}': this.getInitials(variables.dealOwner || ''),
      '{stage}': variables.dealStage || '',
      '{value}': variables.dealValue ? Math.round(variables.dealValue / 1000) + 'k' : '',
      '{type}': variables.dealType || 'deal',
      '{region}': variables.region || '',
      '{product}': variables.product || '',
      '{priority}': variables.priority || '',
      '{quarter}': this.getCurrentQuarter(),
      '{fiscal_year}': this.getFiscalYear(variables.fiscalYearStart)
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      channelName = channelName.replace(new RegExp(placeholder, 'g'), value);
    }

    channelName = channelName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    return channelName;
  }

  static getInitials(name) {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toLowerCase()
      .substring(0, 3);
  }

  static getCurrentQuarter() {
    const month = new Date().getMonth() + 1;
    return 'q' + Math.ceil(month / 3);
  }

  static getFiscalYear(fiscalYearStart = 1) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (currentMonth >= fiscalYearStart) {
      return 'fy' + currentYear;
    } else {
      return 'fy' + (currentYear - 1);
    }
  }

  static validateChannelName(name) {
    const errors = [];
    
    if (!name || name.length === 0) {
      errors.push('Channel name cannot be empty');
    }
    
    if (name.length > 80) {
      errors.push('Channel name must be 80 characters or less');
    }
    
    if (!/^[a-z0-9-_]+$/.test(name)) {
      errors.push('Channel name can only contain lowercase letters, numbers, hyphens, and underscores');
    }
    
    if (name.startsWith('-') || name.startsWith('_')) {
      errors.push('Channel name cannot start with a hyphen or underscore');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  static getDefaultTemplates() {
    return [
      {
        name: 'Standard Deal',
        template: 'deal-{client_short}-{date}',
        description: 'Standard format: deal-clientname-YYYY-MM-DD',
        variables: ['clientName']
      },
      {
        name: 'Deal with Stage',
        template: 'deal-{stage}-{client_short}-{month}{year}',
        description: 'Includes deal stage: deal-stage-client-MMYYYY',
        variables: ['clientName', 'dealStage']
      },
      {
        name: 'Owner Based',
        template: 'deal-{owner_initials}-{client_short}-{quarter}',
        description: 'Owner initials with quarter: deal-abc-client-q1',
        variables: ['clientName', 'dealOwner']
      },
      {
        name: 'Value Based',
        template: 'deal-{value}-{client_short}-{date}',
        description: 'Deal value included: deal-100k-client-date',
        variables: ['clientName', 'dealValue']
      },
      {
        name: 'Product Deal',
        template: '{product}-deal-{client_short}-{year}',
        description: 'Product-specific deals: product-deal-client-year',
        variables: ['clientName', 'product']
      },
      {
        name: 'Regional Deal',
        template: 'deal-{region}-{client_short}-{quarter}{year}',
        description: 'Region-based naming: deal-region-client-q1yyyy',
        variables: ['clientName', 'region']
      },
      {
        name: 'Priority Deal',
        template: '{priority}-deal-{client_short}-{month}',
        description: 'Priority level deals: high-deal-client-MM',
        variables: ['clientName', 'priority']
      },
      {
        name: 'Fiscal Year',
        template: 'deal-{fiscal_year}-{client_short}-{deal_id}',
        description: 'Fiscal year based: deal-fy2024-client-id',
        variables: ['clientName', 'dealId']
      }
    ];
  }
}

module.exports = NamingService;