import { useNavigate } from 'react-router-dom';

export const useFilterNavigation = () => {
  const navigate = useNavigate();

  const navigateToFilteredAds = (filterType, filterItem) => {
    console.log('Navigating with filter:', filterType, filterItem);
    
    let filterId = '';
    let filterName = '';

    switch(filterType) {
      case 'Category':
        filterId = filterItem.VehicleTypeID || filterItem.id;
        filterName = encodeURIComponent(filterItem.CategoryName || filterItem.displayName || filterItem.name);
        break;
      case 'Brand':
        filterId = filterItem.BrandID || filterItem.id;
        filterName = encodeURIComponent(filterItem.BrandName || filterItem.displayName || filterItem.name);
        break;
      case 'Model':
        filterId = filterItem.ModelID || filterItem.id;
        filterName = encodeURIComponent(filterItem.ModelNameEnglish || filterItem.displayName || filterItem.name);
        break;
      case 'Body Type':
        filterId = filterItem.BodyTypeID || filterItem.id;
        filterName = encodeURIComponent(filterItem.BodyTypeName || filterItem.displayName || filterItem.name);
        break;
      case 'Budget':
        filterId = `${filterItem.MinAmount}-${filterItem.MaxAmount}`;
        filterName = encodeURIComponent(filterItem.RangeLabel || filterItem.displayName || filterItem.name);
        break;
      default:
        return;
    }

    navigate(`/vehicles/${filterType.toLowerCase().replace(' ', '-')}/${filterId}?name=${filterName}`);
  };

  return { navigateToFilteredAds };
};