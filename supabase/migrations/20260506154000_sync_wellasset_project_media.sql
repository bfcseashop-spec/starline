-- Sync public project media/details from wellassetgroup.com source pages.
-- Addresses and image links below are mapped from:
--   /ongoing/project
--   /handover/project
--   /upcoming/project

UPDATE public.customer_projects
SET
  location = 'Shekhertek, Shyamoli Housing Society, House-27/C, Road-6, Mohammadpur, Dhaka-1207',
  building_image_url = 'https://wellassetgroup.com/uploads/backend/images/projects/631571038.jpg'
WHERE lower(project_name) IN ('starline neeraloy villa', 'well asset neeraloy villa');

UPDATE public.customer_projects
SET
  location = 'Shah Ali Bug, House-37/4/C & 37/4/4, Mirpur-1, Dhaka-1216',
  building_image_url = 'https://wellassetgroup.com/uploads/backend/images/projects/709332200.jpg'
WHERE lower(project_name) IN ('starline tower', 'well asset tower');

UPDATE public.customer_projects
SET
  location = 'House: 291 - 298, Road / Lane: 18, Block: A, Avenue: 5, Section: 11, Mirpur, Dhaka - 1216',
  building_image_url = 'https://wellassetgroup.com/uploads/backend/images/projects/2103092219.jpg'
WHERE lower(project_name) IN ('starline tower - 1', 'well asset tower - 1');

UPDATE public.customer_projects
SET
  location = 'House: 479/1-2, Road / Lane: 5, East Kazipara, Mirpur, Dhaka - 1216',
  building_image_url = 'https://wellassetgroup.com/uploads/backend/images/projects/1170747971.jpg'
WHERE lower(project_name) IN ('starline shanti niketon', 'well asset shanti niketon');

-- Refresh project_images gallery entries for the same projects.
WITH target_projects AS (
  SELECT
    id,
    lower(project_name) AS key_name
  FROM public.customer_projects
  WHERE lower(project_name) IN (
    'starline neeraloy villa',
    'well asset neeraloy villa',
    'starline tower',
    'well asset tower',
    'starline tower - 1',
    'well asset tower - 1',
    'starline shanti niketon',
    'well asset shanti niketon'
  )
)
DELETE FROM public.project_images pi
USING target_projects tp
WHERE pi.project_id = tp.id;

INSERT INTO public.project_images (project_id, image_url, sort_order, caption)
SELECT id, 'https://wellassetgroup.com/uploads/backend/images/projects/631571038.jpg', 1, 'Well Asset Neeraloy Villa'
FROM public.customer_projects
WHERE lower(project_name) IN ('starline neeraloy villa', 'well asset neeraloy villa')
UNION ALL
SELECT id, 'https://wellassetgroup.com/uploads/backend/images/projects/709332200.jpg', 1, 'Well Asset Tower'
FROM public.customer_projects
WHERE lower(project_name) IN ('starline tower', 'well asset tower')
UNION ALL
SELECT id, 'https://wellassetgroup.com/uploads/backend/images/projects/2103092219.jpg', 1, 'Well Asset Tower - 1'
FROM public.customer_projects
WHERE lower(project_name) IN ('starline tower - 1', 'well asset tower - 1')
UNION ALL
SELECT id, 'https://wellassetgroup.com/uploads/backend/images/projects/1170747971.jpg', 1, 'Well Asset Shanti Niketon'
FROM public.customer_projects
WHERE lower(project_name) IN ('starline shanti niketon', 'well asset shanti niketon');
