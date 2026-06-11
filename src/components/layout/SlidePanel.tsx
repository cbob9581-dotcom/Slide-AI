import { useDocumentStore } from '../../stores/documentStore';
import { PanelHeader } from '../ui/PanelHeader';
import { ImageViewer } from '../viewer/ImageViewer';

interface SlidePanelProps {
  style?: React.CSSProperties;
}

export function SlidePanel({ style }: SlidePanelProps) {
  const { currentDoc, currentPage, pages } = useDocumentStore();
  const page = pages[currentPage - 1];

  if (!currentDoc) {
    return (
      <div style={style} className="flex items-center justify-center bg-gray-950 text-gray-500">
        <p className="text-sm">请先打开课件文件</p>
      </div>
    );
  }

  return (
    <div style={style} className="flex flex-col bg-gray-950 min-w-0">
      <PanelHeader
        title={`原课件`}
        subtitle={page ? `第 ${currentPage} / ${pages.length} 页` : ''}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {page ? (
          <ImageViewer src={page.imagePath} alt={`第 ${page.pageNumber} 页`} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            正在加载...
          </div>
        )}
      </div>
    </div>
  );
}
